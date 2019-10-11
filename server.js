'use strict'
const express = require("express")
const crawl = require("./crawl")
const bodyParser = require("body-parser")
const fs = require("fs")
const fspromises = fs.promises
const app = express()
const { fork } = require("child_process")
app.use(bodyParser.json());
const hittp = require('hittp')

app.post("/crawl", (req, res) => {
  // crawlDomain(req.body.domain, Date.parse("2019-10-05"))
})

app.get('/', function (req, res) {
  res.send('Hello World')
})

const crawlDomain = (domain, since) => {
  return new Promise((resolve, reject) => {
    const spawned = fork("./crawl.js", [domain, since.toString()])
    resolve(spawned)
  })
}

app.listen(9999, "0.0.0.0", async () => {
  let domains = await fspromises.readFile("./data/domains.json")
  domains = JSON.parse(domains.toString())
  let index = Math.floor(Math.random() * domains.length)
  domains = domains.reverse()
  // domains = ["www.ekathimerini.com", "www.independent.ie"]
  // let domain = domains[index]
  // domain = "thebalance.com"
  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  let forks = []
  for (const domain of domains) {
    while (forks.length >= 10) {
      await sleep(5000)
    }
    crawlDomain(`www.${domain}`, Date.parse("2019-10-05")).then((spawned) => {
      forks.push(spawned.pid)
      spawned.on("message", (msg) => {
        console.log("Received message from child", msg)
      })
      spawned.on("exit", (code, signal) => {
        console.log("Finished crawling", domain)
        let index = -1
        for (let i = 0; i < forks.length; i++) {
          const fork = forks[i]
          if (fork == spawned.pid) {
            index = i
            break
          }
        }
        if (index !== -1) forks.splice(index, 1)
      })
    }).catch((err) => {
      console.error(err)
    })
    await sleep(5000)
  }
})