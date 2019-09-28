'use strict'

const crypto = require('crypto');
const fs = require("fs")
const url = require("url")
const path = require("path")
const cachepath = require("./cachepath")
const cachestream = require("./cachestream")

class CacheError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor);
  }
}

const get = async (url) => {
  const stream = getstream(url)
  if (stream === null) return null

  stream.on("data", (chunk) => {
    console.log("data cache file read stream")
  })
  stream.on("end", () => {
    console.log("end cache file read stream")
  })
}

const getstream = async (url) => {
  const filepath = cachepath.getCachePath(url)
  const stream = fs.createReadStream(filepath)
  stream.on("ready", () => {
    return stream
  })
  stream.on("error", (err) => {
    console.error(err)
    return null
  })
}

const set = async (url, response) => {
}

module.exports = {
  get,
  getstream,
  set,
  setPath: cachepath.setPath
}