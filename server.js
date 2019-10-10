'use strict'
const express = require("express")
const crawl = require("./crawl")
const bodyParser = require("body-parser")
const fs = require("fs")
const app = express()
app.use(bodyParser.json());

app.post("/crawl", (req, res) => {
  crawlDomain(req.body.domain, Date.parse("2019-10-05"))
})

app.get('/', function (req, res) {
  res.send('Hello World')
})
 
// app.listen(9999)

const crawlDomain = (domain, since) => {
  return new Promise((resolve, reject) => {
    crawl.crawl(domain, since).then((crawlstream) => {
      resolve(crawlstream)
    }).catch((err) => {
      reject(err)
    })
  })
}

fs.readFile("./data/domains.json", (err, data) => { 
  let domains = JSON.parse(data.toString())
  let index = Math.floor(Math.random() * domains.length)
  let domain = domains[index]
  // domain = "rollingstone.com"
  console.log(domain)
  crawlDomain(`www.${domain}`, Date.parse("2019-10-05")).then((crawlstream) => {
    // res.sendStatus(200)
    const file = fs.createWriteStream(`./data/urlsets/${domain}.urlset`)
    crawlstream.on("end", () => {
      console.log("Crawlstream ended")
    })
    crawlstream.pipe(file)
  }).catch((err) => {
    console.error(err)
  })
})