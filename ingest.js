'use strict'
const fs = require("fs")
const fspromise = fs.promises
const { Client } = require("@elastic/elasticsearch")
const client = new Client({node: "http://127.0.0.1:9200"})

let start = null, end = null, filecount = 0, linenums = []

const ITERATIONS = 39

const ingestFile = (filename) => {
  const filestream = fs.createReadStream(filename)
  let lastChunk = null
  let lineNum = 0
  let articles = []
  filestream.on("data", (chunk) => {
    const chunkarticles = chunk.toString().split("\n")
    lineNum += chunkarticles.length
    for (let i = 0; i < chunkarticles.length-1; i++) {
      let jsonarticle = chunkarticles[i].toString()
      if (i === 0 && lastChunk) {
        lastChunk = lastChunk.toString()
        lastChunk = lastChunk.concat(jsonarticle)
        jsonarticle = lastChunk
        lastChunk = null
      }
      try {
        let idindex = jsonarticle.indexOf(`"id":`) + 5
        let id = jsonarticle.slice(idindex+1, jsonarticle.indexOf(",", idindex)-1)
        // const article = JSON.parse(jsonarticle)
        articles.push({ "index" : { "_index" : "article", "_id" : id } })
        // articles.push(JSON.stringify(article))
        articles.push(jsonarticle)
      } catch (err) {
        console.error(err.message, filename, lineNum)
      }
    }
    lastChunk = chunkarticles[chunkarticles.length-1]
    if (lastChunk.includes("\n")) {
      articles.push(lastChunk)
      lastChunk = null
    }
    if (articles.length >= 500) {
      const body = articles.slice()
      articles = []
      client.bulk({body}, {}, (err, res) => {
        if (err) console.error(err.body)
        if (res.body.items.length != body.length/2) {
          console.log("Didn't get all items", res.body.items.length, body.length/2)
        }
      })
    }
  })
  filestream.on("close", () => {
    if (articles.length > 0) {
      const body = articles.slice()
      articles = []
      client.bulk({body}, {}, (err, res) => {
        if (err) console.error(err.body)
        if (res.body.items.length != body.length/2) {
          console.log("Didn't get all items", res.body.items.length, body.length/2)
        }
      })
    }
    filecount++
    linenums.push(lineNum)
    if (filecount === ITERATIONS) {
      let linecount = linenums.reduce((res, val) => {
        return res + val
      })
      console.log(linecount)
      console.log(`Execution Time: ${Date.now()-start} ms`)
    }
  })
}

const main = async () => {
  start = Date.now()
  for (let i = 39; i < 43; i++) {
    ingestFile(`./data/articles-${i}.ndjson`)
  }
}

main()