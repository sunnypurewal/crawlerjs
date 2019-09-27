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
    console.log("fetched robots.txt ", robotstxt)
    const robots = robotsparser.parse(robotstxt, url)
    return robots
  } catch (error) {
    throw error
  }
}

module.exports = {
  get: get
}