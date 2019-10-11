'use strict'
const crawlbot = require("./crawlbot")
const bot = crawlbot()

bot.listen((options) => {
  console.log("Crawlbot started at", `${options.host}:${options.port}`)
})