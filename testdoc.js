'use strict'

const hittp = require("hittp")
const bulk = require("./bulk")
const { JSDOM } = require("jsdom")

const url = hittp.str2url("https://www.buzzfeed.com/ehisosifo1/anne-hathaway-movie-quiz")
hittp.get(url).then((html) => {
  html = html.toString()
  let item = bulk.getItem(html, url)
  console.log(item)
})