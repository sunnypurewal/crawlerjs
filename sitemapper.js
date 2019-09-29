'use strict'

const http = require("hittp")
const sax = require("sax"),
  strict = true, // set to false for html-mode
  parser = sax.createStream(strict)
const moment = require("moment")

const getRecursive = async (url) => {
  return new Promise((resolve, reject) => {
    get(url).then((sitemap) => {
      if (sitemap.sitemaps) {
        const urls = []
        let j = 0
        for (const mapurl of sitemap.sitemaps) {
          console.log("Recursing sitemaps")
          getRecursive(mapurl).then((urlset) => {
            urls.push(...urlset)
            j++
            if (j === sitemap.sitemaps.length) {
              resolve(urls)
            }
          })
        }
      } else if (sitemap.urls) {
        resolve(sitemap.urls)
      }
    })
  })
}

const get = async (url) => {
  return new Promise((resolve, reject) => {
    const urls = []
    const sitemaps = []
    let loc = null
    let lastmod = null
    let text = ""
    
    http.stream(url).then((stream) => {
      stream.pipe(parser)
      parser.on("opentag", (node) => {
      })
      parser.on("closetag", (name) => {
        if (name === "loc") {
          loc = text
        } else if (name === "lastmod") {
          // const last = moment(text)
          // const now = moment()
          // if (now.diff(last, "years") < 1) {
            lastmod = text
          // }
        } else if (name === "url") {
          const url = {loc}
          if (lastmod) url.lastmod = lastmod
          urls.push(url)
        } else if (name === "sitemap") {
          const sitemap = {loc}
          if (lastmod) sitemap.lastmod = lastmod
          sitemaps.push(loc)
        } else if (name === "urlset") {
          // console.log(`URLSET with ${urls.length} URLS`)
          resolve({urls})
        } else if (name === "sitemapindex") {
          // console.log(`SITEMAPINDEX with ${sitemaps.length} sitemaps`)
          resolve({sitemaps})
        }
        text = null
      })
      parser.on("text", (t) => {
        text = t
      })
      parser.on("error", (err) => {
      })
    })
  })
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
module.exports = {
  get,
  getRecursive
}