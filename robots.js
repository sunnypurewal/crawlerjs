'use strict'
const config = require("./config.json")
const fetch = require("node-fetch")
const robotsparser = require("./robots-parser")

const fetchoptions = {
  headers: {
    "User-Agent": config.useragent
  },
  timeout: 10000
}

const get = async (url, callback) => {
  if (url.pathname != "robots.txt") {
    url.pathname = "robots.txt"
  }
  console.log(url.href)
  try {
    const response = await fetch(url)
    const robotstxt = await response.text()
    const robots = robotsparser.parse(robotstxt, url)
    callback(robots)
  } catch (error) {
    console.error(error)
    callback(null)
  }
}

module.exports = {
  get: get
}