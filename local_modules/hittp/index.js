'use strict'

const http = require("./hittp")

module.exports = {
  get: http.get,
  stream: http.stream,
  str2url: require("./urlparse").parse
}