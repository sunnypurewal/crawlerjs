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
        size = stats.size - this.readOffset
        const buffer = Buffer.allocUnsafe(size)
        console.log("Reading ", size)
        this.filehandle.read(buffer, 0, size, this.readOffset).then((obj) => {
          console.log("Read", obj.bytesRead, buffer.toString())
          if (obj.bytesRead) {
            let keepgoing = this.push(buffer)
            console.log("read", keepgoing, obj.bytesRead)
            this.readOffset += obj.bytesRead
          }
        })
      })
    })
  }

  // _writev = (chunks, callback) => {
  //   let j = 0
  //   this.getFilehandle().whenever((err, filehandle) => {
  //     try {
  //       for (let i = 0; i < chunks.length; i++) {
  //         const chunk = chunks[i];
  //         fs.appendFile(filehandle, chunk).then(() => {
  //           j++
  //           if (j === chunks.length) {
  //             callback()
  //           }
  //         })
  //         j++
  //       }
  //     } catch (err) {
  //       console.error(err)
  //       callback(err)
  //     }
  //   })
  // }

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
        const size = stats.size - this.readOffset
        const buffer = Buffer.allocUnsafe(size)
        console.log("finaling ", size)
        this.filehandle.read(buffer, 0, size, this.readOffset).then((obj) => {
          console.log("finaled", obj.bytesRead, buffer.toString())
          if (obj.bytesRead) {
            let keepgoing = this.push(buffer)
            console.log("final", keepgoing, obj.bytesRead)
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