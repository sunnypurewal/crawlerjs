'use strict'

const http = require("./hittp")
module.exports = {
  get: http.get,
  str2url: require("./urlparse").parse
}