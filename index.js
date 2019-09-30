'use strict'
const discovery = require("./urldiscovery/urldiscovery")
const robotsdottxt = require("robotsdottxt")
const jsonfile = require("jsonfile")
const http = require("hittp")
const sitemapper = require("./sitemapper")
const fs = require("fs")

const main = async () => {
  // let urls = await discovery.fromJSON("./.data/domains.json")
  // const random = Math.floor(Math.random() * urls.length-1)
  // urls = urls.slice(random, random+100)
  // urls = ["riverfronttimes.com"]
  // const bots = await robotsdottxt.run(urls)
  // console.log(`Writing out ${bots.length} robots to JSON`)
  // jsonfile.writeFileSync("./.data/robots.json", bots)
  let robots = await jsonfile.readFile("./data/robots.json")
  // const random = Math.floor(Math.random() * robots.length-1)
  // robots = robots.slice(random, random+50)
  // const urls = ["https://www.courierpress.com/news-sitemap.xml"]
  let urls = []
  for (let i = 0; i < robots.length; i++) {
    const robot = robots[i]
    const sitemaps = robot.sitemaps
    for (let j = 0; j < sitemaps.length; j++) {
      let sitemapurl = sitemaps[j]
      if (sitemapurl.indexOf("://") == -1) {
        const url = http.str2url(robot.url)
        sitemapurl = `${url.protocol.replace(":","")}://${url.host}${sitemapurl}`
      }
      urls.push(sitemapurl)
    }
  }
  
  const random = Math.floor(Math.random() * urls.length-1)
  const url = http.str2url(urls[random])
  // const url = http.str2url("https://www.desertsun.com/web-sitemap-index.xml")
  console.log(url.href)
  // const stream = await http.stream(url)
  // stream.on("data", (chunk) => {
  //   console.log("Got data", chunk)
  // })
  try {
    const file = fs.createWriteStream(`./data/${url.host}.sitemap`)
    const sitemapstream = await sitemapper.get(url)
    sitemapstream.pipe(file)
  } catch (err) {
    console.error("index.js", err)
  }
}

main()