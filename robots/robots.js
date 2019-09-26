'use strict'
const config = require("../config")
const http = require("../http/http")
const robotsparser = require("./robots-parser")
const url = require("url")

const fetchoptions = {
  headers: {
    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:69.0) Gecko/20100101 Firefox/69.0"
  },
  timeout: 10000
}

const get = async (url) => {
  if (url.pathname != "robots.txt") {
    url.pathname = "robots.txt"
  }
  console.log(url.href)
  let robotstxt = null
  try {
    robotstxt = await cache.get(url)
  } catch (error) {
    console.log("Fetching robotstxt")
    const response = await http.get(url)
    console.log("Fetched")
    robotstxt = await response.text()
    cache.set(url, robotstxt)
  }
  const robots = robotsparser.parse(robotstxt, url)
  return robots
}

module.exports = {
  get: get
}