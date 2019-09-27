'use strict'

const http = require("http")
const https = require("https")
const cache = require("./cache/cache")
const urlparse = require("./urlparse")
const config = require("../config")

cache.setPath(config.cachepath || "./.cache")
let queue = []
const reqoptions = {
  timeout: 5
}

const processQ = async () => {
  if (queue.length > 0) {
    const params = queue.shift()
    console.log("Picking url off queue", params.url.href, queue.length)
    get(params.url, {resolve:params.resolve,reject:params.reject}, params.redirCount)
  }
}

const get = async (url, promise=null, redirCount=0) => {
  try {
    const cached = await cache.get(url)
    if (cached) {
      console.log("http.cached")
      processQ()
      if (promise) {
        promise.resolve(cached)
        return
      } else return cached
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
    if (Object.keys(h.globalAgent.sockets).length >= 5) {
      console.log("Too many sockets, queueing", url.href)
      queue.push({url,resolve,reject})
      return
    }
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
          processQ()
        })
        res.on("error", (err) => {
          reject(err)
          processQ()
        })
        res.on("aborted", () => {
          reject(new HTTPError("Response Aborted"))
          processQ()
        })
      } else if (res.statusCode >= 300 && res.statusCode <= 399) {
        const location = res.headers.location
        if (location) {
          console.log("Redirecting to ", location)
          queue.push({"url":urlparse.parse(location), resolve, reject, redirCount: redirCount + 1})
          processQ()
          return
        }
      } else {
        reject(new HTTPError(res.statusMessage))
        processQ()
      }
    })
    req.on("abort", () => {
      processQ()
    })
    req.on("timeout", () => {
      req.abort()
      reject(new HTTPError("Timeout"))
    })
    req.on("error", (err) => {
      reject(err)
      processQ()
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