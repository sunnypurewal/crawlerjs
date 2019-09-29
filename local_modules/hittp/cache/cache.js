'use strict'

const fs = require("fs")
const cachepath = require("./cachepath")
const cachestream = require("./cachestream")

class CacheError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor);
  }
}

const getstream = async (url) => {
  return new Promise((resolve, _) => {
    const filepath = cachepath.getReadablePath(url)
    const stream = fs.createReadStream(filepath)
    stream.on("ready", () => {
      resolve(stream)
    })
    stream.on("error", (err) => {
      resolve(null)
    })
  })
}

module.exports = {
  getstream,
  setPath: cachepath.setPath,
  CacheStream: cachestream.CacheStream
}