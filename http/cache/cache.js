'use strict'

const crypto = require('crypto');
const fs = require("fs").promises
const url = require("url")
const path = require("path")

let CACHE_PATH = null
const fsoptions = {recursive: true}

class CacheError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor);
  }
}

const setPath = async (path) => {
  CACHE_PATH = path
  await fs.mkdir(CACHE_PATH, fsoptions)
}

const get = async (url) => {
  if (!CACHE_PATH) throw new CacheError("must call cache.setPath first")
  const folderhash = crypto.createHash("sha256")
  folderhash.update(url.origin)
  const folderkey = folderhash.digest("hex")
  const hash = crypto.createHash("sha256")
  hash.update(url.pathname)
  const key = hash.digest("hex")

  const filepath = path.join(CACHE_PATH, folderkey, key)
  try {
    const response = await fs.readFile(filepath, {encoding: "utf8"})
    return response
  } catch (error) {
    throw new CacheError("Missed Cache")
  }
}

const set = async (url, response) => {
  if (!CACHE_PATH) throw new CacheError("must call cache.setPath first")
  const folderhash = crypto.createHash("sha256")
  folderhash.update(url.origin)
  const folderkey = folderhash.digest("hex")
  const hash = crypto.createHash("sha256")
  hash.update(url.pathname)
  const key = hash.digest("hex")

  const folderpath = path.join(CACHE_PATH, folderkey)
  fs.mkdir(folderpath, fsoptions)
  const filepath = path.join(folderpath, key)
  try {
    await fs.writeFile(filepath, response)
  } catch (error) {
    throw error
  }
}

module.exports = {
  get: get,
  set: set,
  setPath: setPath
}