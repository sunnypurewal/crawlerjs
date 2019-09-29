'use strict'

const http = require("hittp")
const sax = require("sax"),
  strict = true
const moment = require("moment")

const getRecursive = async (url) => {
  // const sitemap = await get(url)
  // if (sitemap.sitemaps) {
  //   const urls = []
  //   let j = 0
  //   for (const mapurl of sitemap.sitemaps) {
  //     const urlset = await getRecursive(mapurl)
  //     console.log(urlset.length)
  //     urls.push(...urlset)
  //     j++
  //     if (j === sitemap.sitemaps.length) {
  //       return urls
  //     }
  //   }
  // } else {
  //   return sitemap.urls
  // }
  return new Promise((resolve, reject) => {
    get(url).then((sitemap) => {
      console.log("GOT SITEMAP", sitemap)
      if (sitemap.sitemaps) {
        const urls = []
        let j = 0
        console.log("Got INDEX", sitemap.sitemaps.length)
        for (const mapurl of sitemap.sitemaps) {
          getRecursive(mapurl).then((urlset) => {
            urls.push(...urlset)
            j++
            if (j === sitemap.sitemaps.length) {
              resolve(urls)
            }
          })
          while (j < sitemap.sitemaps.length) sleep(500)
        }
      } else if (sitemap.urls) {
        console.log("Got URLSET", sitemap.urls.length)
        resolve(sitemap.urls)
      }
    }).catch((err) => {
      console.error("SITEMAPPER ERROR", err)
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
      const parser = sax.createStream(strict)
      stream.pipe(parser)
      // parser.on("pipe", () => {
      //   console.log("parser piped")
      // })
      parser.on("opentag", (node) => {
      })
      parser.on("closetag", (name) => {
        console.log(name)
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
        reject(err)
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