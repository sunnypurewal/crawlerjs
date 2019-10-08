'use strict'
const fs = require("fs").promises

const { JSDOM } = require("jsdom")


const scrape = (html) => {
  const dom = new JSDOM(html)
  const $ = (require("jquery"))(dom.window)
  console.log($("window"))
}

const main = () => {
  fs.readFile("./data/recent.urlset").then((buffer) => {
    console.log(buffer.length)
  })

}

main()