'use strict'

const http = require("http")
const https = require("https")
const cache = require("./cache/cache")
const urlparse = require("./urlparse")
const EventEmitter = require("events")
const emitter = new EventEmitter()
const queue = require("./queue")

cache.setPath("./.cache")
const MAX_CONNECTIONS = 1
const MAX_CONNECTIONS_PER_DOMAIN = 1
const requests = []
const DOMAIN_DELAY = 2000
const lasthit = new Map()
http.globalAgent.maxSockets = MAX_CONNECTIONS
// http.globalAgent.keepAlive = true
https.globalAgent.maxSockets = MAX_CONNECTIONS
// https.globalAgent.keepAlive = true

queue.on("dequeue", (obj) => {
  getstream(obj.url, {resolve:obj.resolve,reject:obj.reject})
})

queue.on("enqueued", (obj) => {
  console.log("hittp enqueued ", obj.url.href)
})

// emitter.addListener("enqueue", (url) => {
//   if (requests.filter((r) => {
//     return r.host == url.host
//   }).length > MAX_CONNECTIONS_PER_DOMAIN) {
//     // console.log("TOO MANY CXNS ON THIS DOMAIN")
//     return
//   }
//   if (requests.length < MAX_CONNECTIONS) {
//     dequeue()
//   } else {
//     // console.log("TOO MANY CONNECTIONS")
//   }
// })

// emitter.addListener("requestend", (url) => {
//   // console.log("request end", url.href)
//   const i = requests.findIndex((r) => {
//     // console.log(r.href, url.href)
//     return r.href == url.href
//   })
//   // console.log(i)
//   if (i === -1) {
//   } else {
//     requests.splice(i, 1)
//   }
//   const connectioncount = requests.filter((r) => {
//     return r.host == url.host
//   }).length

//   // console.log("DOMAIN CXN COUNT ", connectioncount)

//   if (requests.filter((r) => {
//     return r.host == url.host
//   }).length > MAX_CONNECTIONS_PER_DOMAIN) {
//     return
//   }
//   // console.log(requests)
//   if (requests.length < MAX_CONNECTIONS) {
//     dequeue(url)
//   } else {
//     // console.log("TOO MANY CONNECTIONS")
//   }
// })

// emitter.addListener("requesterror", (err, url) => {
//   // console.log("request error", err)
//   const i = requests.findIndex((r) => {
//     return r.href == url.href
//   })
//   if (i === -1) {
//   } else {
//     requests.splice(i, 1)
//   }
//   const connectioncount = requests.filter((r) => {
//     return r.host == url.host
//   }).length

//   // console.log("DOMAIN CXN COUNT ", connectioncount)

//   if (requests.filter((r) => {
//     return r.host == url.host
//   }).length > MAX_CONNECTIONS_PER_DOMAIN) {
//     return
//   }
//   if (requests.length < MAX_CONNECTIONS) {
//     dequeue(url)
//   }
// })

// const delay = async (params) => {
//   const howmany = queue.get(params.url.host).length
//   console.log("delaying domain", params.url.host, howmany, queue.size)
//   setTimeout(() => {
//     queue.enqueue(params)
//   }, DOMAIN_DELAY)
// }

const stream = async (url) => {
  return new Promise((resolve, reject) => {
    if (typeof(url) === "string") url = urlparse.parse(url)
    queue.enqueue({url, resolve, reject})
    // getstream(url).then((stream) => {
    //   resolve(stream)
    // })
  })
}

const getstream = async (url, promise=null, redirCount=0) => {
  return new Promise((resolve, reject) => {
    if (promise) {
      resolve = promise.resolve 
      reject = promise.reject
    }
    cache.getstream(url).then((cached) => {
      if (cached) {
        console.log("http.stream.cached", url.href)
        resolve(cached)
        emitter.emit("requestend", url)
      } else {
        requests.push(url)
        if (redirCount > 10) {
          reject(new HTTPError(`Too many redirects ${url.href}`))
          return
        }
        const h = url.protocol.indexOf("https") != -1 ? https : http
        console.log("http.stream ", url.href)
        const options = {host:url.host, path:url.pathname,timeout:3000}
        // const cachestream = new PassThrough()
        const req = h.request(options, (res) => {
          // resolve(response.pipe(cachestream))
          console.log(res.statusCode, `${options.host}${options.path}`)
          if (res.statusCode >= 200 && res.statusCode <= 299) {
            lasthit.set(url.host, Date.now())
            const cachestream = new cache.CacheStream(url)
            resolve(res.pipe(cachestream))
            res.on("end", () => {
              emitter.emit("requestend", url)
            })
            res.on("error", (err) => {
              emitter.emit("requesterror", err, url)
            })
            res.on("aborted", () => {
              emitter.emit("requesterror", new HTTPError("Aborted"), url)
            })
          } else if (res.statusCode >= 300 && res.statusCode <= 399) {
            const location = res.headers.location
            if (location) {
              console.log("Redirecting to ", location)
              // const obj = {url: urlparse.parse(location), resolve, reject}
              // emitter.emit("requestend", obj.url)
              // queue.enqueue(obj)
              const newurl = urlparse.parse(location)
              requests.forEach((r, i, arr) => {
                if (r.href == url.href) arr[i] = newurl
              })
              getstream(newurl, {resolve, reject}, redirCount+1)
              return
            }
          } else {
            lasthit.set(url.host, Date.now())
            emitter.emit("requesterror", new HTTPError(res.statusMessage), url)
            reject(new HTTPError(res.statusMessage))
          }
        })
        req.on("abort", () => {
          // emitter.emit("requesterror", err, url)
        })
        req.on("timeout", () => {
          req.abort()
          reject(new HTTPError("Timeout"))
          emitter.emit("requesterror", new HTTPError("Timeout"), url)
        })
        req.on("error", (err) => {
          reject(err)
          emitter.emit("requesterror", err, url)
        })
        req.end()
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
  stream
}