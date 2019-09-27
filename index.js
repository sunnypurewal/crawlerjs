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
  const children = root.childNodes
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeName === "url" || child.nodeName === "sitemap") {
      for (let j = 0; j < child.childNodes.length; j++) {
        const c = child.childNodes[j];
        if (c.nodeName === "loc") {
          console.log("loc", c.textContent)
        } else if (c.nodeName === "lastmod") {
          console.log("lastmod", c.textContent)
        } 
      }
    }
  }
  // const sitemaps = xpath.select("//sitemap", root)
  // const urlset = xpath.select("//url", root)
  // console.log(sitemaps, urlset)
  // if (root.nodeName === "sitemapindex") {
  //   const sitemaps = root.childNodes
  //   for (let i = 0; i < sitemaps.length; i++) {
  //     const element = sitemaps[i];
  //     if (element.nodeName === "sitemap") {
  //       console.log("sitemap")
  //       for (let j = 0; j < element.childNodes.length; j++) {
  //         const e = element.childNodes[j];
  //         console.log(e.nodeName, e.textContent) 
  //       }
  //     }
  //   }
  //   console.log(`Index with ${sitemaps.length} sitemaps`)
  // } else if (root.nodeName === "urlset") {
  //   const urls = root.childNodes
  //   for (let i = 0; i < urls.length; i++) {
  //     const element = urls[i];
  //     if (element.nodeName === "url") {
  //       console.log("url")
  //       const loc = element.removeChild("loc")
  //       const lastmod = element.removeChild("lastmod")
  //       console.log(loc, lastmod)
  //     }
  //   }
  //   console.log(`URL set with ${urls.length} URLs`)
  // }
}

main()