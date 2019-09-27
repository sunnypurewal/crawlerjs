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
    console.log("getStartURLs returned", domains.length)
    return domains
  } catch (error) {
    return []
  }
}

const getRobots = async () => {
  let domains = await getStartURLs()
  const random = Math.floor(Math.random() * domains.length-1)
  domains = domains.slice(random, random+15)
  domains = [new URL("http://centredaily.com")]
  for (const domain of domains) {
    console.log(domain)
    const robot = await robots.get(domain)
    if (robot !== null) {
      console.log(robot.toString)
    }
  }
  console.log("Returning from get robots")
}

getRobots().then(() => {
  console.log("GOT")
})