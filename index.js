'use strict'

const Server = require("crawlbot-server")

const server = new Server()

server.onHTML = (html, url) => {
}

server.listen((options) => {
  console.log(`Crawlbot Server started at ${options.host}:${options.port}`)
})