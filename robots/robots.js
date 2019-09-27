'use strict'
const config = require("../config")
const http = require("../http/http")
const robotsparser = require("./robotsparser")
const url = require("url")
const urlparse = require("../http/urlparser")

const get = async (url) => {
  url = urlparse.parse(`${url}/robots.txt`)
  if (!url) return null
  try {
    const robotstxt = await http.get(url)
    const robots = robotsparser.parse(robotstxt, url)
    return robots
  } catch (error) {
    return null
  }
}

module.exports = {
  get: get
}