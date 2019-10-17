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
  domains = partition(domains, MAX_PROCESSES)
  for (let i = 0; i < domains.length; i++) {
    let list = domains[i]
    crawlbot.multicrawl(list, SINCE)
  }
}
const partition = (array, numParts) => {
  let size = Math.ceil(array.length / numParts)
  let partitions = []
  for (let i = 0; i < numParts; i++) {
    partitions.push(array.slice(i*size, (i*size)+size))
  }
  return partitions
}

main()

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}