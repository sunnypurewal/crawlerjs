'use strict'

const path = require("path")
const fs = require("fs").promises
const crypto = require('crypto')

const fsoptions = {recursive: true}

let CACHE_PATH = "./.cache"

const setPath = (path) => {
  CACHE_PATH = path
  fs.mkdir(CACHE_PATH, fsoptions, (err) => {
    if (err) console.error(err)
  })
}

const getWritablePath = async (url) => {
  const dir = getCacheDirname(url)
  try {
    await fs.mkdir(dir, fsoptions)
    return path.join(dir, getCacheFilename(url))
  } catch (error) {
    console.error(error)
    return null
  }
}

const getReadablePath = (url) => {
  return path.join(getCacheDirname(url), getCacheFilename(url))
}

const getCacheDirname = (url) => {
  const hash = crypto.createHash("sha256")
  hash.update(url.origin)
  const key = hash.digest("hex")
  return path.join(CACHE_PATH, key)
}

const getCacheFilename = (url) => {
  const hash = crypto.createHash("sha256")
  hash.update(url.pathname)
  return hash.digest("hex")
}

module.exports = {
  getWritablePath,
  getReadablePath,
  CACHE_PATH,
  setPath
}