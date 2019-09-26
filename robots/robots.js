'use strict'
const config = require("../config")
const http = require("../http/http")
const httphelpers = require("../http/helpers")
const robotsparser = require("./robots-parser")
const url = require("url")

const fetchoptions = {
  headers: {
    // "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:69.0) Gecko/20100101 Firefox/69.0"
    "User-Agent": "NewsBot/1.0 (http://electionsearch.ca)"
  },
  timeout: 10000
}

const get = async (url) => {
  url = httphelpers.validateURL(url)
  if (!url) return null
  if (url.pathname != "robots.txt") {
    url.pathname = "robots.txt"
  }
  let robotstxt = null
  // try {
    // robotstxt = await cache.get(url)
  // } catch (error) {
    robotstxt = await http.get(url)
  // }
  const robots = robotsparser.parse(robotstxt, url)
  return robots
}

module.exports = {
  get: get
}