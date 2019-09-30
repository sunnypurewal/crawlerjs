'use strict'

const http = require("hittp")
const sax = require("sax"),
  strict = true
const moment = require("moment")
const stream = require("stream")

const get = async (url) => {
  if (url.pathname.endsWith(".gz")) {
    console.log("gz")
    url.pathname = url.pathname.slice(0, -3)
  }
  try {
    const sitemapstream = await _getRecursive(url)
    return sitemapstream
  } catch (err) {
    console.error("sitemapper.get", err.message)
    return null
  }
}

const _getRecursive = async (url, outstream=null) => {
  return new Promise((resolve, reject) => {
    let isSitemapIndex = false
    _get(url).then((urlstream) => {
      if (!outstream) {
        outstream = stream.PassThrough()
        resolve(outstream)
      }
      urlstream.on("data", (chunk) => {
        const chunkstring = chunk.toString()
        if (chunkstring === "sitemapindex") {
          isSitemapIndex = true
        } else if (isSitemapIndex) {
          const chunkobj = JSON.parse(chunkstring)
          if (chunkobj.lastmod) {
            const now = moment()
            const then = moment(chunkobj.lastmod)
            if (now.diff(then, "years") < 1) {
              _getRecursive(chunkobj.loc, outstream)
            }
          } else {
            _getRecursive(chunkobj.loc, outstream)
          }
          //chunk is a sitemap
        } else {
          outstream.write(chunk)
          //chunk is a URL
        }
      })
      // urlstream.on("end", () => {
        // if (!isSitemapIndex) outstream.end()
      // })
    }).catch((err) => {
      console.error("RECURSIVE ERROR", err.message)
    })
  })
}

const _get = async (url) => {
  return new Promise((resolve, reject) => {
    const urls = []
    const sitemaps = []
    let loc = null
    let lastmod = null
    let text = ""
    
    http.stream(url).then((httpstream) => {
      const parser = sax.createStream(strict)
      httpstream.pipe(parser)
      const passthrough = stream.PassThrough()
      resolve(passthrough)
      parser.on("opentag", (node) => {
        if (node.name === "sitemapindex") {
          passthrough.write(node.name)
        }
      })
      parser.on("closetag", (name) => {
        if (name === "loc") {
          loc = text
        } else if (name === "lastmod") {
          lastmod = text
        } else if (name === "url") {
          if (passthrough.writableEnded) return
          const obj = {loc}
          if (lastmod) obj.lastmod = lastmod
          passthrough.write(`${JSON.stringify(obj)}\n`)
        } else if (name === "sitemap") {
          if (passthrough.writableEnded) return
          const obj = {loc}
          if (lastmod) obj.lastmod = lastmod
          passthrough.write(`${JSON.stringify(obj)}\n`)
        } else if (name === "urlset") {
          passthrough.end()
        } else if (name === "sitemapindex") {
          passthrough.end()
        }
        text = null
      })
      parser.on("text", (t) => {
        text = t
      })
      parser.on("error", (err) => {
        // resolve({urls, sitemaps})
        reject(err)
      })
    }).catch((err) => {
      console.error("HTTP STREAM ERROR", err.message)
    })
  })
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
module.exports = {
  get
}