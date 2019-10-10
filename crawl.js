'use strict'
const hittp = require("hittp")
const getsitemap = require("getsitemap")
const fs = require("fs")

const crawl = (domain, since) => {
  return new Promise((resolve, reject) => {
    const mapper = new getsitemap.SiteMapper(false)
    mapper.map(domain, since).then((sitemapstream) => {
      resolve(sitemapstream)
    }).catch((err) => {
      reject(err)
    })
  })
}

module.exports = {
  crawl
}