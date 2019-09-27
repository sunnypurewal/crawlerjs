'use strict'
class RobotsTxt {
  constructor(url) {
    this.allows = []
    this.disallows = []
    this.sitemaps = []
    this.url = url
    this.crawlDelay = 3
  }
  toString() {
    return `${this.url}
    Allows: ${this.allows}
    Disallows: ${this.disallows}
    Sitemaps: ${this.sitemaps}
    `
  }
}

const parse = (robotstxt/*: string */, baseURL) => {
  const robots = new RobotsTxt(baseURL)
  const lines = robotstxt.split("\n")
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const kv = getKeyVal(line)
    if (!kv) continue
    const key = kv.key
    const val = kv.val
    if (key === "user-agent") {
      if (val === "*") {
        i = parseUserAgent(lines, i+1, robots)
      }
    } else if (key === "sitemap") {
      robots.sitemaps.push(val)
    }
  }
  return robots
}

const parseUserAgent = (lines, startIndex, robots) => {
  let i = startIndex
  for (; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim().length == 0) break
    if (line.startsWith("#")) continue
    const kv = getKeyVal(line)
    const key = kv.key
    const val = kv.val
    if (key === "allow") { 
      robots.allows.push(val)
    } else if (key === "disallow") {
      robots.disallows.push(val)
    } else if (key === "crawl-delay") {
      robots.crawlDelay = val
    }
  }
  return i + 1
}

const getKeyVal = (line, lower=true) => {
  if (line.length == 0) return null
  if (line.startsWith("#")) return null
  let colon = line.indexOf(":")
  if (colon === -1) return null
  const kv = {}
  kv.key = line.slice(0, colon)
  kv.val = line.slice(colon+1).trim()
  if (lower) kv.key = kv.key.toLowerCase(); kv.val = kv.val.toLowerCase();
  return kv
}

module.exports = {
  parse: parse
}