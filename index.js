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
  let i = Math.floor(Math.random() * domains.length-1)
  const random = []
  for (let j = 0; j < 1; j++) {
    random.push(domains[i])
    i = Math.floor(Math.random() * domains.length-1)
  }
  console.log(`Fetching robots for ${random.length} domains`)
  for (const domain of random) {
  // domains = [new URL("https://www.miamiherald.com/robots.txt")]
  // for (const domain of domains) {
    robots.get(domain, (robots/*: RobotsTxt */) => {
      if (robots) {
      }
    })
  }
})