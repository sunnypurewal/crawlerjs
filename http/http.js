'use strict'

const http = require("http")
const https = require("https")
const cache = require("./cache/cache")
const GetHandler = require("./handlers").GetHandler
const config = require("../config")

cache.setPath(config.cachepath || "./.cache")
const reqoptions = {
  timeout: 5
}

const get = async (url, redirCount=0, promise) => {
  try {
    const cached = await cache.get(url)
    if (cached) {
      console.log("http.cached")
      return cached
    }
  } catch (error) {}
  if (redirCount > 10) {
    promise.reject(new HTTPError("Too many redirects"))
    return
  }
  return new Promise((resolve, reject) => {
    if (promise) {
      resolve = promise.resolve 
      reject = promise.reject
    }
    const h = url.protocol.indexOf("https") != -1 ? https : http
    console.log("http.get ", url.href)
    const options = {host:url.host, path:url.pathname}
    h.get(options, (res) => {
      console.log(res.statusCode, url.href)
      if (res.statusCode >= 200 && res.statusCode <= 299) {
        const data = []
        res.on("data", (chunk) => {
          console.log("Data")
          data.push(chunk)
        })
        res.on("end", () => {
          const utf8str = Buffer.concat(data).toString()
          cache.set(url, utf8str)
          resolve(utf8str)
        })
        res.on("error", (err) => {
          console.log("http error")
          console.error(err)
        })
      } else if (res.statusCode >= 300 && res.statusCode <= 399) {
        const location = res.headers.location
        if (location) {
          console.log("Redirecting to ", location)
          get(new URL(location), redirCount + 1, {resolve, reject})
          return
        }
      } else {
        console.error("HTTP Error ", res.statusCode)
        //404?
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