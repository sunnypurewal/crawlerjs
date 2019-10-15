'use strict'

const crawlbot = require("crawlbot")
const fs = require("fs")
const fspromises = fs.promises
const hittp = require("hittp")
const bulk = require("./bulk")
const os = require("os")
const shuffle = require('knuth-shuffle').knuthShuffle;

let forks = []
const SINCE = "2019-10-14"

const main = async () => {
  let data = null
  try {
    data = await fspromises.readFile("./data/domains.json")
  } catch (err) {
    throw err
  }
  let domains = []
  try {
    domains = JSON.parse(data.toString())
    shuffle(domains)
  } catch (err) {
    throw err
  }
  for (const domain of domains) {
    while (forks.length >= 25) {
      await sleep(5000)
    }
    const url = hittp.str2url(domain)
    if (!url) continue
    const filepath = `./data/articles/${url.host}.ndjson`
    const file = fs.createWriteStream(filepath)
    const forked = crawlbot.crawl(url, SINCE, (html, url) => {
      onHTML(html, url, file)
    }, (hosturl, proc, code, signal) => {
      console.log("Finished crawling", hosturl.host)
      let index = -1
      for (let i = 0; i < forks.length; i++) {
        const fork = forks[i]
        if (fork.pid == proc.pid) {
          index = i
          break
        }
      }
      if (index !== -1) forks.splice(index, 1)
      file.close()
      fspromises.stat(filepath).then((stats) => {
        if (stats.size === 0) {
          fspromises.unlink(filepath).then(() => {
          })
        }
      }).catch((err) => {
        console.error(err)
      })
    })
    console.log("Crawling", url.host)
    forks.push(forked)
    await sleep(1000)
  }
}

const onHTML = (html, url, writestream) => {
  try {
    let item = bulk.getItem(html, url)
    let itemstring = JSON.stringify(item).replace("\n"," ")
    writestream.write(`${itemstring}${os.EOL}`)
  } catch (err) {
    console.error(err)
  }
}

main()

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}