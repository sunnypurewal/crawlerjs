'use strict'
const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const fspromises = fs.promises
const { fork } = require("child_process")
const hittp = require("hittp")

const defaultOptions = {
  port: 9999,
  host: "0.0.0.0",
  maxCrawlers: 10
}

module.exports = (options=defaultOptions) => {
  const app = express()
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  }));
  app.set('view engine', 'ejs');
  app.use(express.static('static'))
  const forks = []

  app.get('/', function (req, res) {
    res.render("index", {forks}, (err, html) => {
      if (err) res.sendStatus(503)
      else res.send(html)
    })
  })

  app.post('/crawl', (req, res) => {
    let domain = req.body.domain
    if (!domain) {
      res.status(400).send("Please include a domain in your POST body")
      return
    }
    domain = hittp.str2url(domain)
    if (!domain) {
      res.status(400).send("Domain was not a valid URL")
      return
    }
    if (forks.length >= options.maxCrawlers) {
      res.status(428).send("Too many active crawlers")
      return
    }
    crawlDomain(domain, Date.parse("2019-10-11")).then((forked) => {
      forks.push({domain, process:forked})
      forked.on("exit", (code, signal) => {
        console.log("Finished crawling", domain)
        let index = -1
        for (let i = 0; i < forks.length; i++) {
          const fork = forks[i]
          if (fork.pid == forked.pid) {
            index = i
            break
          }
        }
        if (index !== -1) forks.splice(index, 1)
      })
      res.redirect("/")
    })
  })

  const crawlDomain = (domain, since) => {
    const parse = (html) => {
      console.log("Parsing", html.slice(500, 1000))
    }
    return new Promise((resolve, reject) => {
      const forked = fork("./crawl.js", [domain, since.toString(), parse])
      resolve(forked)
    })
  }

  return {
    listen(callback) {
      app.listen(options.port, options.host, () => {
        callback(options)
      })
    }
  }
}