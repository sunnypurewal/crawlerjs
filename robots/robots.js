'use strict'
const config = require("../config")
const http = require("../http/http")
const robotsparser = require("./robotsparser")
const url = require("url")
const urlparse = require("../http/urlparser")

const fetchoptions = {
  headers: {
    // "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:69.0) Gecko/20100101 Firefox/69.0"
    "User-Agent": "NewsBot/0.1 (http://electionsearch.ca)"
  },
  timeout: 10000
}

const get = async (url) => {
  url = urlparse.parse(`${url}/robots.txt`)
  if (!url) return null
  const robotstxt = await http.get(url)
  console.log("fetched robots.txt ", robotstxt)
  const robots = robotsparser.parse(robotstxt, url)
  return robots
}

module.exports = {
  get: get
}