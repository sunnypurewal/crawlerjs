'use strict'
const stream = require("stream")

class WebStream extends stream.Duplex {
  constructor(options) {
    super(options)
    this.chunks =[]
  }

  _write = (chunk, enc, cb) => {
    console.log("Writing to webstream")
    this.chunks.push(chunk)
  }

  _read = (size) => {
    console.log("Reading from webstream", size)
    const buffer = Buffer.alloc(size)
    for (let chunk of this.chunks) {
      const chunksize = chunk.length
      if (chunksize <= size) {
        buffer.write(chunk)
      } else {
        buffer.write(chunk.toString().slice(0, size))
        chunk = chunk.slice(size)
        break
      }
    }
    this.push(buffer)
  }
}

module.exports = {
  WebStream
}