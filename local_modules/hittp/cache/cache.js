'use strict'

const fs = require("fs")
const cachepath = require("./cachepath")
const cachestream = require("./cachestream")

const getstream = async (url) => {
  return new Promise((resolve, _) => {
    // console.log("Open getstream")
    const filepath = cachepath.getReadablePath(url)
    const stream = fs.createReadStream(filepath, {emitClose: true, autoDestroy: true})
    stream.on("ready", () => {
      // console.log("getstream ready", url.href)
      resolve(stream)
    })
    stream.on("end", () => {
      // console.log("getstream ended", url.href)
      // stream.close()
    })
    stream.on("close", () => {
      // console.log("getstream closed", url.href)
    })
    stream.on("error", (err) => {
      // stream.close()
      resolve(null)
    })
  })
}

module.exports = {
  getstream,
  setPath: cachepath.setPath,
  CacheStream: cachestream.CacheStream
}