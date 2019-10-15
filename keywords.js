'use strict'

const DOC = require("./doc")
const hittp = require("hittp")
const { JSDOM } = require("jsdom")

const url = hittp.str2url("https://www.cnn.com/2019/10/15/us/christian-music-ccm-trump-blake/index.html")

hittp.get(url).then((html) => {
  const dom = new JSDOM(html.toString())
  let doc = dom.window.document
  const paragraphs = doc.querySelectorAll("div")
  for (const p of paragraphs) {
    console.log(p.textContent)
  }
})