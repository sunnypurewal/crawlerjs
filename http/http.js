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
    const options = {host:url.host, path:url.pathname, timeout: 3000}
    const req = h.request(options, (res) => {
      console.log(res.statusCode, url.href)
      if (res.statusCode >= 200 && res.statusCode <= 299) {
        const data = []
        res.on("data", (chunk) => {
          data.push(chunk)
        })
        res.on("end", () => {
          const utf8str = Buffer.concat(data).toString()
          cache.set(url, utf8str).then(() => {
            resolve(utf8str)
          }).catch((err) => {
            reject(err)
          })
        })
        res.on("error", (err) => {
          reject(err)
        })
      } else if (res.statusCode >= 300 && res.statusCode <= 399) {
        const location = res.headers.location
        if (location) {
          console.log("Redirecting to ", location)
          get(new URL(location), redirCount + 1, {resolve, reject})
          return
        }
      } else {
        reject(new HTTPError(res.statusMessage))
      }
    })
    req.on("timeout", () => {
      req.abort()
      reject(new HTTPError("Timeout"))
    })
    req.on("error", (err) => {
      reject(err)
    })
    req.end()
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