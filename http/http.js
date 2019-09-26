'use strict'

const http = require("http")
const https = require("https")
// const cache = require("./cache/cache")
const url = require("url")
const handlers = require("./handlers")

const reqoptions = {
  timeout: 5
}

const _data = {}

const get = async (url) => {
  const h = url.protocol === "https" ? https : http
  const request = h.request(url, reqoptions)
  h.get(url, reqoptions, (res) => {
    const ha = new handler.GetHandler(res)
    // handler.on("got", got)
  })

  console.log(request)
}

module.exports = {
  get: get
}