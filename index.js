'use strict'
const stream = require("stream")
const fss = require("fs")
const fs = fss.promises
const hittp = require("hittp")
const bulk = require("./bulk")
const elastic = require("./elastic")
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: "http://localhost:9200"
})

const e = () => {
  return new Promise((resolve, reject) => { 
    client.indices.delete({
      index: "article", 
      ignoreUnavailable: true
    }, (err, resp, status) => {
      console.log("Deleted old index", resp.body)
      fs.readFile("./mapping.json").then((mapping) => {
        mapping = JSON.parse(mapping.toString())
        client.indices.create(mapping, ((err, resp, status) => {
          console.log("Created new index", resp.body)
          resolve(true)
        }))
      })
    })
  })
}

const main = async () => {
  await e()
  let urlstrings = null
  let buffer = null
  try {
    buffer = await fs.readFile("./data/recent.urlset")
    if (buffer) {
      urlstrings = buffer.toString().split("\n")
    }
  } catch (err) {
    console.error(err)
    return
  }
  if (!urlstrings || urlstrings.length === 0) {
    console.error("No URL strings")
    return
  }
  let i = 0
  let items = []
  for (const urlstring of urlstrings) {
    if (urlstring.length === 0) continue
    let urlobj = null
    try {
      urlobj = JSON.parse(urlstring)
    } catch (err) {
      console.error("Failed to parse urlobj")
      continue
    }
    let url = hittp.str2url(urlobj["loc"])
    let html = null
    try {
      html = await hittp.get(url)
    } catch (err) {
      console.error(err.statusCode ? err.statusCode : "", err.message)
      continue
    }
    const item = bulk.getItem(html, url)
    items.push(JSON.stringify(item).replace("\n",""))
    if (items.length >= 1000) {
      await fs.writeFile(`./data/articles-${i}.ndjson`, items.join("\n"))
      items = []
      i += 1
    }
  }
  if (items.length > 0) {
    await fs.writeFile(`./data/articles-${i}.ndjson`, items.join("\n"))
  }
}

main()