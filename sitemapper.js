'use strict'

const http = require("hittp")

const parseSitemaps = async (url) => {
  const sitemap = await http.get(url)
  return sitemap
}

module.exports = {
  parseSitemaps
}