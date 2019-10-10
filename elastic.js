'use strict'
const stream = require("stream")
const fs = require("fs").promises
const workerpool = require('workerpool');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: "http://localhost:9200"
})
const load = require("./load")

const FLUSH_INTERVAL = 10

class ElasticStream extends stream.Writable {
  static chunks = []
  constructor(options={}) {
    super(options)
    // this.pool = workerpool.pool("./load.js")
  }

  _write = (chunk, enc, cb) => {
    const item = JSON.parse(chunk.toString())
    
    console.log("_write")
    // let start = Date.now()
    let index = -1
    let array = []
    if (ElasticStream.chunks.length === 0) {
      ElasticStream.chunks.unshift(array)
      index = 0
    } else {
      for (let i = 0; i < ElasticStream.chunks.length; i++) {
        const arr = ElasticStream.chunks[i]
        if (arr.length < FLUSH_INTERVAL) {
          index = i
          array = arr
          break
        }
      }
      if (index === -1) {
        ElasticStream.chunks.unshift(array)
        index = 0
      } else {
        array = ElasticStream.chunks[index]
      }
    }
    if (index === -1) {
      console.error("Could not find array in chunks")
      return
    }
    const chunkstring = chunk.toString()
    array.push(JSON.parse(chunkstring))
    console.log(array.length)
    if (array.length >= FLUSH_INTERVAL) {
      load.dump(array, client).then((resp) => {
        console.log("bulk", resp)
        cb()
      }).catch((err) => {
        console.error("bulk", err)
        cb()
      })
    } else {
      cb()
    }
      // cb(null, null)
      // this.pool.exec("./load.js", [array.slice()]).then((res) => {
      //   console.log("POOL EXEC FINISHED")
      //   array = []
      //   ElasticStream.chunks[index] = array
      //   cb(null, null)
      // })
      // .catch((err) => {
      //   console.error("__write Pool exec failed")
      //   array = []
      //   ElasticStream.chunks[index] = array
      //   cb(null, null)
      // })
    // } else {
    //   cb()
    // }
    // console.log("Copied buffer", buffer.length, chunk.length, buffer.toString())
    // this.pool.exec(ElasticStream.__write, [chunk.toString().slice()])
    // .then((result) => {
    //   console.log("_write pool request finished")
    // }).catch((err) => {
    //   console.error("_write pool request failed")
    // })
  }
}

module.exports = {
  ElasticStream,
  client
}