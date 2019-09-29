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
    if (!this.filehandle) {
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
    let keepgoing = false
    do {
      keepgoing = this.push(chunk)
    } while (keepgoing && this.queue.length > 0)
  }

  // _writev = (chunks, callback) => {
  //   console.log("Writing chunks to CacheStream")
  //   this.queue.push(...chunks)
  //   // console.log(...chunks)
  //   let j = 0
  //   for (let i = 0; i < chunks.length; i++) {
  //     const chunk = chunks[i];
  //     this.getFilehandle().then((filehandle) => {
  //       try {
  //         fs.appendFile(filehandle, chunk).then(() => {
  //           j++
  //           if (j === chunks.length) {
  //             callback()
  //           }
  //         })
  //       } catch (err) {
  //         console.error(err)
  //         j++
  //         if (j === chunks.length) {
  //           callback(err)
  //         }
  //       }
  //     })
  //   }
  // }

  _write = (chunk, encoding, callback) => {
    this.queue.push(chunk)
    // console.log(chunk.toString())
    this.getFilehandle().then((filehandle) => {
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
    console.log("Cache stream finishing", this.queue.length)
    let chunk = this.queue.shift()
    let keepgoing = false
    do {
      keepgoing = this.push(chunk)
      chunk = this.queue.shift()
    } while (keepgoing && this.queue.length > 0)
    this.push(null)
    console.log("Cache stream finished", this.queue.length)
    callback()
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