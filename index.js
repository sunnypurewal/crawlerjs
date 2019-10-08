'use strict'
const fs = require("fs").promises
const hittp = require("hittp")

const { JSDOM } = require("jsdom")


const scrape = (html) => {
  const dom = new JSDOM(html)
  const $ = (require("jquery"))(dom.window)
  console.log($("window"))
}

const main = () => {
  fs.readFile("./data/recent.urlset").then((buffer) => {
    let urlstrings = buffer.toString().split("\n")
    for (const urlstring of urlstrings) {
      try {
        const urlobj = JSON.parse(urlstring)
        const loc = urlobj["loc"]
        const url = hittp.str2url(loc)
        if (!url) continue
        
      } catch (err) {
        console.error(err)
      }
    }
  })

}

main()