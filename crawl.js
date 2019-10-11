'use strict'
const hittp = require("hittp")
const getsitemap = require("getsitemap")
const fs = require("fs")
const bulk = require("./bulk")
const os = require("os")
// const workerpool = require('workerpool');

const crawl = (domain, since, parse) => {
  console.log("Crawling", domain)
  // return new Promise((resolve, reject) => {
    if (!domain) return
    const mapper = new getsitemap.SiteMapper(false)
    mapper.map(domain, since).then((sitemapstream) => {
      sitemapstream.on("data", (chunk) => {
        const chunkstring = chunk.toString()
        let chunkobj = null
        try {
          chunkobj = JSON.parse(chunkstring)
        } catch (err) {
          console.error(err.message)
          return
        }
        const url = hittp.str2url(chunkobj.loc)
        if (!url) return
        hittp.get(url).then((html) => {
          html = html.toString()
          parse(html)
        }).catch((err) => {
          console.error(err.message)
        })
      })
      sitemapstream.on("close", () => {
        // console.log("sitemapstream closed")
      })
    }).catch((err) => {
      // reject(err)
    })
  // })
} 

crawl(process.argv[2], new Date(parseFloat(process.argv[3])))

// workerpool.worker({
//   crawl
// })

// module.exports = {
//   crawl
// }