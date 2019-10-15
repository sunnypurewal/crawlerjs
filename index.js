'use strict'

const crawlbot = require("crawlbot")
const fs = require("fs")
const hittp = require("hittp")

let forks = []
const SINCE = "2019-10-14"

const main = async () => {
  fs.readFile("./data/domains.json", (err, data) => {
    if (err) {
      console.error(err.message)
      return
    }

    let domains = []
    try {
      domains = JSON.parse(data.toString())
    } catch (err) {
      console.error(err.message)
      return
    }

    for (const domain of domains) {
      while (forks.length >= 10) {
        await sleep(5000)
      }
      const url = hittp.str2url(domain)
      if (!url) continue
      const file = fs.createWriteStream(`./data/articles/${url.host}.ndjson`)
      crawlbot.crawl(url, SINCE, (html, url) => {
        onHTML(html, url, file)
      }, () => {

      })
    }
  })
}

const onHTML = (html, url, writestream) => {

}

main()

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}