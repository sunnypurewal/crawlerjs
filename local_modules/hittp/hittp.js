'use strict'

const http = require("http")
const https = require("https")
const cache = require("./cache/cache")
const urlparse = require("./urlparse")
const EventEmitter = require("events")
const emitter = new EventEmitter()

cache.setPath("./.cache")
const queue = new Map()
const MAX_CONNECTIONS = 1
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
  const i = requests.findIndex((r) => {
    return r.href == url.href
  })
  // console.log(`Request ended ${i} ${requests.length}`)
  if (i === -1) {
  } else {
    requests.splice(i, 1)
  }
  // console.log(requests.length)
  dequeue(url)
})

emitter.addListener("requesterror", (err, url) => {
  const i = requests.findIndex((r) => {
    return r.href == url.href
  })
  if (i === -1) {
  } else {
    requests.splice(i, 1)
  }
  dequeue(url)
})

const delay = (params) => {
  console.log("Delaying domain", params.url.host)
  setTimeout(() => {
    enqueue(params)
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
      // console.log("Dequeueing same domain")
      urlq = queue.get(url.host)
      nextobj = urlq.shift()
      if (urlq.length > 0) queue.set(url.host, urlq)
      else queue.delete(url.host)
    } else {
      // console.log("Dequeuing different domain")
      const key = queue.keys().next().value
      console.log("dq key", key)
      urlq = queue.get(key)
      nextobj = urlq.shift()
      if (urlq.length > 0) queue.set(key, urlq)
      else queue.delete(key)
    }
    const hit = lasthit.get(nextobj.url.host) || 0
    const timesince = Date.now() - hit
    console.log(hit, timesince)
    if (timesince < DOMAIN_DELAY) {
      console.log("Delaying domain", nextobj.url.host, timesince)
      delay(nextobj)
    } else {
      requests.push(nextobj.url)
      getstream(nextobj.url, {resolve:nextobj.resolve,reject:nextobj.reject})
    }
  } else {
    console.log("http queue is empty")
  }
}

const stream = async (url) => {
  return new Promise((resolve, reject) => {
    if (typeof(url) === "string") url = urlparse.parse(url)
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
        emitter.emit("requestend")
        resolve(cached)
        return
      }
    })
    const h = url.protocol.indexOf("https") != -1 ? https : http
    console.log("http.stream ", url.href)
    const options = {host:url.host, path:url.pathname,timeout:10000}
    // const cachestream = new PassThrough()
    const req = h.request(options, (res) => {
      // resolve(response.pipe(cachestream))
      console.log(res.statusCode, `${options.host}${options.path}`)
      if (res.statusCode >= 200 && res.statusCode <= 299) {
        lasthit.set(url.host, Date.now())
        console.log(lasthit)
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
          enqueue({url: urlparse.parse(location), resolve, reject})
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