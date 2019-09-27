'use strict'
const jsonfile = require("jsonfile")
const urllib = require("url")
const robots = require("./robots/robots")

const start = (callback, filename="domains.json") => {
  jsonfile.readFile(filename, (err, obj) => {
    if (err) console.log(err)
    const domains = []
    const categories = Object.keys(obj)
    for (const cat of categories) {
      const urlList = obj[cat]
      for (const u of urlList) {
        domains.push(u)
      }
    }
    callback(domains)
  })
}

start((domains) => {
  const random = Math.floor(Math.random() * domains.length-1)
  domains = [domains[random]]
  domains = [new URL("https://fosters.com/")]
  for (const domain of domains) {
    robots.get(domain, (robots/*: RobotsTxt */) => {
      if (robots) {
        console.log(robots)
      }
    })
  }
})