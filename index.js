'use strict'
const jsonfile = require("jsonfile")
const urllib = require("url")
const robots = require("./robots/robots")
const discovery = require("./urldiscovery/urldiscovery")

const getRobots = async () => {
// (async () => {
  let domains = await discovery.fromJSON("./.data/domains.json")
  const bots = []
  // const random = Math.floor(Math.random() * domains.length-1)
  // domains = domains.slice(random, random+200)
  // domains = ["opensecrets.org"]
  console.log(`Fetching robots for ${domains.length} domains`)
  // let i = 0
  // for (const domain of domains) {
  //   robots.get(domain).then(robot => {
  //     if (robot != null) {
  //       bots.push(robot)
  //     }
  //     i++
  //     console.log(i)
  //   })
  // }
  // while (i < domains.length) await sleep(500)
  return bots
}
const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
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