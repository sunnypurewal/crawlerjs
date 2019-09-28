'use strict'

const http = require("hittp")
const sax = require("sax"),
  strict = true // set to false for html-mode

const get = async (url) => {
  const saxstream = sax.createStream()
  const urls = []
  const sitemaps = []
  let loc = null
  let lastmod = null
  let text = ""
  saxstream.on("error", (err) => {
    console.error(err)
  })
  saxstream.on("opentag", (node) => {
    const name = node.name
    if (name === "URL") {
      url = {}
    }
  })
  saxstream.on("text", (t) => {
    text = t
  })
  saxstream.on("closetag", (name) => {
    if (name == name && text && text.length > 0) {
      if (name === "LOC") {
        loc = text
      } else if (name === "LASTMOD" && text) {
        lastmod = text
      } else if (name === "URL" && text) {
        urls.push({loc,lastmod})
        text = null
      } else if (name === "SITEMAP") {
        sitemaps.push({loc,lastmod})
        text = null
      } else if (name === "SITEMAPINDEX" || name === "URLSET") {
        console.log(urls,sitemaps)
        return {urls, sitemaps}
      }
    }
  })
  saxstream.on("pipe", () => {
    console.log("Saxstream piped")
  })

  saxstream.on("data", (chunk) => {
    console.log("saxstream data")
  })
  
  const response = await http.stream(url)
  response.pipe(saxstream)
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
module.exports = {
  get
}