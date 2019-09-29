'use strict'

const http = require("hittp")
const sax = require("sax"),
  strict = true, // set to false for html-mode
  parser = sax.createStream(strict)

const get = async (url) => {
  return new Promise((resolve, reject) => {
    const urls = []
    const sitemaps = []
    let loc = null
    let lastmod = null
    let text = ""
    
    http.stream(url).then((stream) => {
      stream.on("readable", () => {
        let data

        while (data = stream.read()) {
          console.log(data.toString())
        }
      })
      // stream.on("data", (chunk) => {
      //   console.log(chunk.toString())
      // })
      stream.on("end", () => {
        console.log("http stream ended")
      })
      stream.on("error", () => {
        console.log("http stream error")
      })
    })
  })
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
module.exports = {
  get
}