'use strict'

const http = require("http")
const https = require("https")
const cache = require("./cache/cache")
const helpers = require("./helpers")
const GetHandler = require("./handlers").GetHandler

const reqoptions = {
  timeout: 5
}

const get = async (url, redirCount=0, promise) => {
  if (redirCount > 10) {
    promise.reject(new HTTPError("Too many redirects"))
    return
  }
  return new Promise((resolve, reject) => {
    url = helpers.validateURL(url)
    if (!url) {
      (promise.reject || reject)(new HTTPError("Invalid URL"))
      console.log("Invalid URL")
      return
    }
    const h = url.protocol === "https:" ? https : http
    h.get(url, reqoptions, (res) => {
      if (res.statusCode === 301) {
        const location = res.headers.location
        if (location) {
          get(new URL(location), redirCount + 1, {resolve, reject})
          return
        }
      } else if (res.ok) {
        const data = []
        res.on("data", (chunk) => {
          data.push(chunk)
        })
        res.on("end", () => {
          const buffer = Buffer.concat(data)
          const utf8str = buffer.toString()
          cache.set(url, utf8str)
          console.log(res.statusCode, url.href)
          (promise.resolve || resolve)(utf8str)
        })
      }
    })
  })
}

class HTTPError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  get: get
}