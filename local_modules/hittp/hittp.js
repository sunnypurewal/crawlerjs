'use strict'

const http = require("http")
const https = require("https")
const cache = require("./cache/cache")
const urlparse = require("./urlparse")
const queue = require("./queue")

cache.setPath("./.cache")
const MAX_CONNECTIONS = 2
http.globalAgent.maxSockets = MAX_CONNECTIONS
// http.globalAgent.keepAlive = true
https.globalAgent.maxSockets = MAX_CONNECTIONS
// https.globalAgent.keepAlive = true

queue.on("dequeue", (obj) => {
  getstream(obj.url, {resolve:obj.resolve,reject:obj.reject})
})

queue.on("enqueued", (obj) => {
  // console.log("hittp enqueued ", obj.url.href)
})

const stream = async (url) => {
  return new Promise((resolve, reject) => {
    if (typeof(url) === "string") url = urlparse.parse(url)
    cache.getstream(url).then((cached) => {
      if (cached) {
        console.log("http.stream.cached", url.href)
        resolve(cached)
      } else {
        queue.enqueue({url, resolve, reject})
      }
    })
  })
}

const getstream = async (url, promise=null, redirCount=0) => {
  return new Promise((resolve, reject) => {
    if (promise) {
      resolve = promise.resolve 
      reject = promise.reject
    }
    if (redirCount > 10) {
      reject(new HTTPError(`Too many redirects ${url.href}`))
      return
    }
    const h = url.protocol.indexOf("https") != -1 ? https : http
    console.log("http.stream ", url.href)
    const options = {host:url.host, path:url.pathname,timeout:3000}
    const req = h.request(options, (res) => {
      console.log(res.statusCode, `${options.host}${options.path}`)
      if (res.statusCode >= 200 && res.statusCode <= 299) {
        const cachestream = new cache.CacheStream(url)
        resolve(res.pipe(cachestream))
      } else if (res.statusCode >= 300 && res.statusCode <= 399) {
        const location = res.headers.location
        if (location) {
          console.log("Redirecting to ", location)
          const newurl = urlparse.parse(location)
          getstream(newurl, {resolve, reject}, redirCount+1)
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
  stream
}