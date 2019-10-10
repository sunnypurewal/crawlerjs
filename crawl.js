'use strict'
const hittp = require("hittp")
const getsitemap = require("getsitemap")
const fs = require("fs")

const crawl = (domain) => {
  return new Promise((resolve, reject) => {
    const mapper = new getsitemap.SiteMapper()
    mapper.map(domain, Date.parse("2019-10-05")).then((sitemapstream) => {
      resolve(sitemapstream)
    }).catch((err) => {
      reject(err)
    })
  })
}

module.exports = {
  crawl
}