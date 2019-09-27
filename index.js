'use strict'
const discovery = require("./urldiscovery/urldiscovery")
const robotsdottxt = require("robotsdottxt")
const jsonfile = require("jsonfile")

const main = async () => {
  let urls = await discovery.fromJSON("./.data/domains.json")
  const random = Math.floor(Math.random() * urls.length-1)
  urls = urls.slice(random, random+1)
  // urls = ["opensecrets.org"]
  const bots = await robotsdottxt.run(urls)
  console.log(`Writing out ${bots.length} robots to JSON`)
  jsonfile.writeFileSync("./.data/robots.json", bots)
}

main()