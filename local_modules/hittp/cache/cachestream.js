'use strict'
const stream = require("stream")
const fs = require("fs").promises
const cachepath = require("./cachepath")

class CacheStream extends stream.Duplex {
  constructor(url, options) {
    super(options)
    this.url = url
    this.filehandle = null
    this.filepath = null
    this.readOffset = 0
    this.creating = false
    this.queue = []
  }

  getFilehandle = async () => {
    if (!this.filehandle && !this.creating) {
      this.creating = true
      const filepath = await cachepath.getWritablePath(this.url)
      const handle = await fs.open(filepath, "w+")
      this.filehandle = handle
      return this.filehandle
    } else {
      return this.filehandle
    }
  }

  _read = (size) => {
    let chunk = this.queue.shift()
    while (this.push(chunk) && this.queue.length > 0) {
      console.log("Reading from cachestream", this.queue.length)
      chunk = this.queue.shift()
    }
  }

  _writev = (chunks, callback) => {
    console.log("Writing chunks to cachestream")
    this.queue.push(...chunks)
    let j = 0
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      this.getFilehandle().then((filehandle) => {
        try {
          fs.appendFile(filehandle, chunk).then(() => {
            j++
            if (j === chunks.length) {
              callback()
            }
          })
        } catch (err) {
          console.error(err)
          j++
          if (j === chunks.length) {
            callback(err)
          }
        }
      })
    }
  }

  _write = (chunk, encoding, callback) => {
    console.log("Writing to cachestream")
    this.queue.push(chunk)
    this.getFilehandle().then((filehandle) => {
      try {
        fs.appendFile(filehandle, chunk, {encoding}).then(() => {
          callback()
        })
      } catch (err) {
        console.error(err)
        callback(err)
      }
    })
  }
  
}

module.exports = {
  CacheStream
}