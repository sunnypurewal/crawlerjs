'use strict'
const getsitemap = require("getsitemap")
const fs = require("fs")
const fspromises = fs.promises

const main = async () => {
  let urls = await fspromises.readFile("./data/domains.json")
  urls = JSON.parse(urls)
  const random = Math.floor(Math.random() * urls.length-1)
  const url = urls[random]
  // const url = "desertsun.com"
  const file = fs.createWriteStream(`./data/urlsets/${url}.urlset`)
  const sitemapstream = await getsitemap.map(url)
  sitemapstream.pipe(file)
}

main()