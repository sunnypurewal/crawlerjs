'use strict'
const hittp = require("hittp")
const getsitemap = require("getsitemap")
const fs = require("fs")
const bulk = require("./bulk")
const os = require("os")

const crawl = (domain, since) => {
  return new Promise((resolve, reject) => {
    const mapper = new getsitemap.SiteMapper(false)
    mapper.map(domain, since).then((sitemapstream) => {
      const file = fs.createWriteStream(`./data/articles/${domain}.ndjson`)
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
          const item = bulk.getItem(html, url)
          file.write(`${JSON.stringify(item).replace("\n"," ")}${os.EOL}`)
        }).catch((err) => {
          console.error(err.message)
        })
      })
      sitemapstream.on("close", () => {
        console.log("sitemapstream closed")
      })
    }).catch((err) => {
      reject(err)
    })
  })
}

module.exports = {
  crawl
}