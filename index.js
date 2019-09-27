'use strict'
const discovery = require("./urldiscovery/urldiscovery")
const robotsdottxt = require("robotsdottxt")

const getRobots = async () => {
  let urls = await discovery.fromJSON("./.data/domains.json")
  const random = Math.floor(Math.random() * urls.length-1)
  urls = urls.slice(random, random+1)
  // urls = ["opensecrets.org"]
  let robots = await robotsdottxt.run(urls)
  return robots
}

(async () => {
  const bots = await getRobots()
  console.log(`Writing out ${bots.length} robots to JSON`)
  jsonfile.writeFileSync("robots.json", bots)
})()

// getStartURLs().then((domains) => {
//   console.log(`Got ${domains.length} domains`)
//   const bots = []
//   const random = Math.floor(Math.random() * domains.length-1)
//   domains = domains.slice(random, random+15)
//   for (const domain of domains) {
//     getRobot(domain).then((robot) => {
//       bots.push(robot)
//     }).catch((err) => {
//       console.error(err)
//     })
//   }

  // getRobots(domains).then((robots) => {
  //   console.log(`Got ${robots.length} robots.txt from ${domains.length} domains`)
  // }).catch((err) => {
  //   console.error("Main errored out")
  // })
// })