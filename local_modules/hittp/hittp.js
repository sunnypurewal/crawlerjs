'use strict'

const http = require("http")
const https = require("https")
const cache = require("./cache/cache")
const urlparse = require("./urlparse")
const EventEmitter = require("events")
const emitter = new EventEmitter()

cache.setPath("./.cache")
const queue = new Map()
const MAX_CONNECTIONS = 2
const requests = []
const DOMAIN_DELAY = 3000
const lasthit = new Map()
http.globalAgent.maxSockets = MAX_CONNECTIONS
http.globalAgent.keepAlive = true
https.globalAgent.maxSockets = MAX_CONNECTIONS
https.globalAgent.keepAlive = true

emitter.addListener("enqueue", () => {
  if (requests.length < MAX_CONNECTIONS) {
    dequeue()
  }
})

emitter.addListener("requestend", (url) => {
  console.log("requestend event")
  dequeue()
})

emitter.addListener("requesterror", (err) => {
  console.log("requesterror event")
  dequeue()
})

const processQ = async () => {
  if (queue.size > 0) {
    const params = queue.shift()
    // const now = Date.now()
    const hit = lasthit.get(params.url.host)
    if (Date.now() - hit < DOMAIN_DELAY) {
      delay(params)
    //   queue.push(params)
    //   processQ()
    } else {
      console.log("Picking url off queue", params.url.href, queue.length)
      stream(params.url, {resolve:params.resolve,reject:params.reject}, params.redirCount)
    }
  }
}

const delay = (params) => {
  console.log("Delaying domain", params.url.host)
  setTimeout(() => {
    queue.push(params)
    processQ()
  }, DOMAIN_DELAY)
}

const enqueue = async (obj) => {
  const url = obj.url
  if (!queue.has(url.host)) queue.set(url.host, [])
  queue.get(url.host).push(obj)
  emitter.emit("enqueue")
}

const dequeue = async (url=null) => {
  if (queue.size > 0) {
    let nextobj = null
    let urlq = null
    if (url && queue.has(url.host)) {
      urlq = queue.get(url.host)
      nextobj = urlq.shift()
      if (urlq.length > 0) queue.set(url.host, urlq)
      else queue.delete(url.host)
    } else {
      const key = queue.keys().next().value
      urlq = queue.get(key)
      nextobj = urlq.shift()
      if (urlq.length > 0) queue.set(key, urlq)
      else queue.delete(key)
    }
    requests.push(nextobj)
    getstream(nextobj.url, {resolve:nextobj.resolve,reject:nextobj.reject})
  } else {
    console.log("http queue is empty")
  }
}

const stream = async (url) => {
  return new Promise((resolve, reject) => {
    enqueue({url, resolve, reject})
    // getstream(url).then((stream) => {
    //   resolve(stream)
    // })
  })
}

const getstream = async (url, promise=null) => {
  return new Promise((resolve, reject) => {
    if (promise) {
      resolve = promise.resolve 
      reject = promise.reject
    }
    if (typeof(url) === "string") url = urlparse.parse(url)
    cache.getstream(url).then((cached) => {
      if (cached) {
        console.log("http.stream.cached")
        resolve(cached)
      }
    })
    const h = url.protocol.indexOf("https") != -1 ? https : http
    const hit = lasthit.get(url.host)
    const timesince = Date.now() - hit
    // if (timesince < DOMAIN_DELAY) {
      // delay({url, resolve, reject})
      // console.log("Delaying domain", url.host, timesince)
      // pushQ({url,resolve, reject})
    // }
    console.log("http.stream ", url.href)
    const options = {host:url.host, path:url.pathname,timeout:3000}
    // const cachestream = new PassThrough()
    const req = h.request(options, (res) => {
      // resolve(response.pipe(cachestream))
      console.log(res.statusCode, `${options.host}${options.path}`)
      if (res.statusCode >= 200 && res.statusCode <= 299) {
        lasthit.set(options.host, Date.now())
        res.on("end", () => {
          emitter.emit("requestend")
        })
        res.on("error", (err) => {
          emitter.emit("requesterror")
        })
        res.on("aborted", () => {
          emitter.emit("requesterror")
        })
        const cachestream = new cache.CacheStream(url)
        resolve(res.pipe(cachestream))
      } else if (res.statusCode >= 300 && res.statusCode <= 399) {
        const location = res.headers.location
        if (location) {
          console.log("Redirecting to ", location)
          enqueue({url: urlparse.parse(location), resolve, reject})
          return
        }
      } else {
        lasthit.set(options.host, Date.now())
        emitter.emit("requesterror")
        reject(new HTTPError(res.statusMessage))
      }
    })
    req.on("abort", () => {
      // emitter.emit("requesterror")
    })
    req.on("timeout", () => {
      req.abort()
      reject(new HTTPError("Timeout"))
      emitter.emit("requesterror")
    })
    req.on("error", (err) => {
      reject(err)
      emitter.emit("requesterror")
    })
    req.end()
  })
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
    processQ()
    promise.reject(new HTTPError("Too many redirects"))
    return
  }
  return new Promise((resolve, reject) => {
    if (promise) {
      resolve = promise.resolve 
      reject = promise.reject
    }
    const h = url.protocol.indexOf("https") != -1 ? https : http
    if (Object.keys(h.globalAgent.sockets).length >= MAX_CONNECTIONS) {
      console.log("Too many sockets, queueing", url.href)
      queue.push({url, resolve, reject})
      return
    }
    console.log("http.get ", url.href)
    const options = {host:url.host, path:url.pathname, timeout: 3000}
    const req = h.request(options, (res) => {
      console.log(res.statusCode, url.href)
      if (res.statusCode >= 200 && res.statusCode <= 299) {
        lasthit.set(options.host, Date.now())
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
          pushQ({
            url: urlparse.parse(location),
            resolve, reject,
            redirCount: redirCount + 1
          })
          return
        }
      } else {
        lasthit.set(options.host, Date.now())
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
  get,
  stream
}