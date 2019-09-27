'use strict'
const discovery = require("./urldiscovery/urldiscovery")
const robotsdottxt = require("robotsdottxt")
const jsonfile = require("jsonfile")
const http = require("hittp")
const sitemap = require("./sitemapper")
const DOMParser = require('xmldom').DOMParser;
const select = require("xpath.js")

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
  const urls = []
  for (let i = 0; i < robots.length; i++) {
    const robot = robots[i]
    const roboturl = http.str2url(robot.url)
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
  console.log(url.href)
  const sitemap = await http.get(url)
  const root = new DOMParser().parseFromString(sitemap).documentElement
  const allurls = []
  const allsitemaps = []
  const children = root.childNodes
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeName === "url" || child.nodeName === "sitemap") {
      let loc = null, lastmod = null
      for (let j = 0; j < child.childNodes.length; j++) {
        const c = child.childNodes[j];
        if (c.nodeName === "loc") {
          loc = c.textContent
        } else if (c.nodeName === "lastmod") {
          lastmod = c.textContent
        }
      }
      if (loc) {
        if (child.nodeName === "sitemap") {
          allsitemaps.push({loc, lastmod})
        } else {
          allurls.push({loc, lastmod})
        }
      }
    }
  }

  console.log(allurls, allsitemaps)
}

main()