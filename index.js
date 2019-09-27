'use strict'
const jsonfile = require("jsonfile")
const urllib = require("url")
const robots = require("./robots/robots")

const getStartURLs = async (filename="domains.json") => {
  try {
    const obj = await jsonfile.readFile(filename)
    const domains = []
    const categories = Object.keys(obj)
    for (const cat of categories) {
      const urlList = obj[cat]
      for (const u of urlList) {
        domains.push(u)
      }
    }
    return domains
  } catch (error) {
    return []
  }
}

(async () => {
// (async () => {
  let domains = await getStartURLs()
  const bots = []
  const random = Math.floor(Math.random() * domains.length-1)
  domains = domains.slice(random, random+2)
  domains = ["ny1.com"]
  console.log(`Fetching robots for ${domains.length} domains`)
  for (const domain of domains) {
    const robot = await robots.get(domain)
    if (robot != null) {
      console.log("GOT A ROBOT")
      bots.push(robot)
    }
  }
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