'use strict'

const crawlbot = require("crawlbot")
const fs = require("fs")
const fspromises = fs.promises
const hittp = require("hittp")
const bulk = require("./bulk")
const os = require("os")
const shuffle = require('knuth-shuffle').knuthShuffle;
const article = require("article")

let forks = []
const SINCE = "2019-10-16"
const MAX_PROCESSES = os.cpus().length - 1

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
  let domainList = []
  let i = 1
  const random = Math.floor(Math.random() * domains.length-1)
  domains = domains.slice(random, random+2)
  for (const domain of domains) {
    while (forks.length >= MAX_PROCESSES) {
      await sleep(5000)
    }
    const url = hittp.str2url(domain)
    if (!url) continue
    domainList.push(url.href)
    // if (domainList.length < 50) continue
    const filepath = `./data/articles/batch-${i}.ndjson`
    const forked = crawlbot.multicrawl(domainList, SINCE, (html, url) => {
      onHTML(html, url, file)
    }, (hosturl, proc, code, signal) => {
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
    forks.push(forked)
    domainList = []
    i += 1
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

const partition = (array, numParts) => {
  let size = Math.ceil(array.length / numParts)
  let partitions = []
  for (let i = 0; i < size; i++) {
    partitions.push(array.slice(i*size, (i*size)+size))
  }
  return partitions
}

main()

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}