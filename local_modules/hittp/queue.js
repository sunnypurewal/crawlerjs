'use strict'
const events = require("events")
const emitter = new events.EventEmitter()
const queue = new Map()
const DOMAIN_DELAY_S = 3
const DOMAIN_DELAY_MS = DOMAIN_DELAY_S * 1000

const on = (event, callback) => {
  if (event === "dequeue") {
    emitter.addListener("dequeue", (obj) => {
      callback(obj)
    })
  } else if (event === "enqueued") {
    emitter.addListener("enqueued", (obj) => {
      callback(obj)
    })
  }
}

const enqueue = (obj) => {
  const url = obj.url
  // if (!queue.has(url.host)) queue.set(url.host, {})
  const qobj = queue.get(url.host) || {}
  let count = qobj.count || 0
  const lastdq = qobj.lastdq || 0

  if (lastdq > 0 && count === 0) {
    console.log("Enqueuing", url.host, "for", DOMAIN_DELAY_MS - (Date.now() - lastdq), "ms")
    setTimeout(() => {
      dequeue(obj)
    }, DOMAIN_DELAY_MS - (Date.now() - lastdq))
  } else {
    console.log("Enqueuing", url.host, "for", (count * DOMAIN_DELAY_MS), "ms")
    setTimeout(() => {
      dequeue(obj)
    }, DOMAIN_DELAY_MS * count)
  }

  count += 1
  queue.set(url.host, {count, lastdq})


  // queue.get(url.host).push(obj)
  // console.log("enqueued", url.href)
  emitter.emit("enqueued", url)
}

const dequeue = (obj) => {
  if (emitter.listenerCount("dequeue") === 0) {
    enqueue(obj)
    return
  }
  const qobj = queue.get(obj.url.host)
  let count = qobj.count
  let lastdq = qobj.lastdq
  count -= 1
  lastdq = Date.now()
  queue.set(obj.url.host, {count, lastdq})
  emitter.emit("dequeue", obj)
}

// const dequeue = (url=null) => {
//   if (queue.size > 0) {
//     let nextobj = null
//     let qkey = null
//     if (url && queue.has(url.host)) {
//       qkey = url.host
//     } else {
//       qkey = queue.keys().next().value
//     }
//     const qvalue = queue.get(qkey)
//     nextobj = qvalue.shift()
//     if (qvalue.length > 0) queue.set(qkey, qvalue)
//     else queue.delete(qkey)
    
//     let connectioncount = requests.filter((r) => {
//       return r.host == nextobj.url.host
//     }).length

//     const hit = lasthit.get(nextobj.url.host) || 0
//     const timesince = Date.now() - hit
//     if (timesince < DOMAIN_DELAY) {// && connectioncount >= MAX_CONNECTIONS_PER_DOMAIN) {
//       // console.log("Delaying domain", nextobj.url.host, timesince)
//       delay(nextobj)
//     } else {
//       connectioncount = requests.filter((r) => {
//         return r.host == nextobj.url.host
//       }).length
//       // console.log("PUSHED CXN COUNT ", connectioncount)
//       getstream(nextobj.url, {resolve:nextobj.resolve,reject:nextobj.reject})
//     }
//   } else {
//     console.log("http queue is empty")
//   }
// }


module.exports = {
  enqueue,
  on,
  emitter
}