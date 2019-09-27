'use strict'
const http = require("hittp")
const robotsparser = require("./robotsparser")
const url = require("url")

const get = async (url) => {
  if (url.indexOf("/robots.txt") == -1) url = `${url}/robots.txt`
  url = http.str2url(url)
  if (!url) return null
  try {
    const robotstxt = await http.get(url)
    const robots = robotsparser.parse(robotstxt, url)
    return robots
  } catch (error) {
    console.error(error)
    return null
  }
}

module.exports = {
  get
}