'use strict'
const stream = require("stream")
const fs = require("fs").promises
const cachepath = require("./cachepath")
const Future = require('future')

class CacheStream extends stream.Duplex {
  constructor(url, options) {
    super(options)
    this.url = url
    this.filehandle = null
    this.filepath = null
    this.readOffset = 0
    this.creating = false
    this.queue = []
    this.future = null
  }

  getFilehandle = () => {
    if (!this.future) this.future = Future.create(this)
    else return this.future
    cachepath.getWritablePath(this.url).then((filepath) => {
      fs.open(filepath, "w+").then((handle) => {
        this.filehandle = handle
        this.future.deliver(null, handle)
      })
    })
    return this.future
  }

  _read = (size) => {
    this.getFilehandle().whenever((err, filehandle) => {
      this.filehandle.stat().then((stats) => {
        size = Math.max(0, stats.size - this.readOffset)
        const buffer = Buffer.allocUnsafe(size)
        this.filehandle.read(buffer, 0, size, this.readOffset).then((obj) => {
          if (obj.bytesRead) {
            let keepgoing = this.push(buffer)
            this.readOffset += obj.bytesRead
          }
        })
      })
    })
  }
  _write = (chunk, encoding, callback) => {
    this.getFilehandle().whenever((err, filehandle) => {
      try {
        fs.appendFile(filehandle, chunk, {encoding}).then(() => {
          callback()
        })
      } catch (err) {
        callback(err)
      }
    })
  }
  
  _final = (callback) => {
    this.getFilehandle().whenever((err, filehandle) => {
      this.filehandle.stat().then((stats) => {
        const size = Math.max(0, stats.size - this.readOffset)
        const buffer = Buffer.allocUnsafe(size)
        this.filehandle.read(buffer, 0, size, this.readOffset).then((obj) => {
          if (obj.bytesRead) {
            let keepgoing = this.push(buffer)
            this.readOffset += obj.bytesRead
          }
          callback()
        })
      })
    })
  }

  _destroy = (err, callback) => {
    if (err) console.error("Destroying cachestream due to error", err)
    else {
      callback()
    }
  }
}

module.exports = {
  CacheStream
}