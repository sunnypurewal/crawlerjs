'use strict'

const http = require("hittp")
const sax = require("sax"),
  strict = true, // set to false for html-mode
  parser = sax.createStream(strict)

const get = async (url) => {
  return new Promise((resolve, reject) => {
    const urls = []
    const sitemaps = []
    let loc = null
    let lastmod = null
    let text = ""
    
    http.stream(url).then((stream) => {
      stream.pipe(parser)
      parser.on("pipe", () => {
        console.log("parser piped")
      })
      // parser.on("data", (chunk) => {
      //   console.log("parser got data")
      // })
      parser.on("opentag", (node) => {
      })
      parser.on("closetag", (name) => {
        if (name === "loc") {
          loc = text
        } else if (name === "lastmod") {
          lastmod = text
        } else if (name === "url") {
          const url = {loc}
          if (lastmod) url.lastmod = lastmod
          urls.push(url)
        } else if (name === "sitemap") {
          const sitemap = {loc}
          if (lastmod) sitemap.lastmod = lastmod
          sitemaps.push(url)
        } else if (name === "urlset" || name === "sitemapindex") {
          console.log(urls, sitemaps)
        }
      })
      parser.on("text", (t) => {
        text = t
      })
      parser.on("error", (err) => {
        console.log("parser got error")
      })
      // stream.on("readable", () => {
      //   let data

      //   while (data = stream.read()) {
      //     console.log(data.toString())
      //   }
      // })
      // stream.on("data", (chunk) => {
        // console.log(chunk.toString())
      // })
      // stream.on("end", () => {
      //   console.log("http stream ended")
      // })
      // stream.on("error", () => {
      //   console.log("http stream error")
      // })
    })
  })
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
module.exports = {
  get
}