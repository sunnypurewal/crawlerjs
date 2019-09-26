'use strict'

const urlparse = require("url-parse")

const validateURL = (url) => {
  if (typeof(url) === "string") url = new urlparse(url)
  if (url.href.length === 0) return null
  if (url.protocol.length == 0) url.set("protocol", "http:")
  return url
}

module.exports = {
  validateURL: validateURL
}