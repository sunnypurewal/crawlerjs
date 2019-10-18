'use strict'

const cluster = require("cluster")
const fs = require("fs")
const os = require("os")
const getsitemap = require("getsitemap")
const hittp = require("hittp")
const Mercury = require("@postlight/mercury-parser")
const shuffle = require("knuth-shuffle").knuthShuffle

if (cluster.isMaster) {

  let i = 0
  let domains = null
  try {
    domains = JSON.parse(fs.readFileSync("./data/domains.json"))
    shuffle(domains)
  } catch (err) {
    console.error(err)
    return
  }
  const cpus = os.cpus().length
  const workers = new Array(cpus)
  for (let i = 0; i < cpus; i++) {
    workers.push(cluster.fork({filename:`worker-${i}${Date.now()}`}))
  }

  cluster.on("online", (worker) => {
    worker.send(domains.slice(i, i+25).join(" "))
    i += 25
    console.log("Online")
  })

  cluster.on("message", (worker, message, handle) => {
    if (message === "done") {
      if (domains.length > 0) {
        worker.send(domains.shift())
      }
    }
  })

  cluster.on("exit", (worker, code, signal) => {
    console.log("Exit")
  })

  return
}

const since = "2019-10-17"
const mapper = new getsitemap.SiteMapper()
const file = fs.createWriteStream(process.env.filename)
process.on("message", (msg) => {
  const urls = msg.split(" ").map(u => hittp.str2url(u))
  for (const url of urls) {
    let i = 0
    let closed = false
    mapper.map(url, since).then((sitemapstream) => {
      sitemapstream.on("data", (chunk) => {
        const chunkstring = chunk.toString()
        const split = chunkstring.split("|")
        const pageurl = hittp.str2url(split[0])
        if (!pageurl) return
        i += 1
        hittp.get(pageurl).then((html) => {
          Mercury.parse(pageurl.href, {html, contentType:"text"}).then((article) => {
            file.write(`${pageurl.href}||${article.title}||${article.content}||${article.date_published}||${article.author}`)
            i -= 1
            if (i === 0 && closed) {
              console.log("Done crawling", url.href)
              process.send("done")
            }
          })
        }).catch((err) => {
          //console.error(err.message)
        })
      })
      sitemapstream.on("close", () => {
      })
    }).catch((err) => {
      // console.error(err)
    })
  }
})

