'use strict'
const fss = require("fs")
const fs = fss.promises
const hittp = require("hittp")
const bulk = require("./bulk")
const elastic = require("./elastic")
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: "http://localhost:9200"
})
const webstream = require("./webstream")

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
  // const itemStream = new bulk.ItemStream()
  // const elasticStream = new elastic.ElasticStream()
  const file = fss.createWriteStream("./data/articles.jsonlines")
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
    // try {
      hittp.get(url).then((html) => {
        const item = bulk.getItem(html, url)
        file.write(`${JSON.stringify(item)}
`)
      }).catch((err) => {
        console.error(err.message)
      })
      // const html = await hittp.get(url)
      // const item = bulk.getItem(html, url)
      // const resp = await client.index({id:item.id,index:"article",body:item})
      // console.log(resp.body._shards.successful)
    // } catch (err) {
    //   console.error(err.body)
    // }
    // hittp.get(url).then((html) => {
    //   // passthrough.write(html)
    //   const item = bulk.getItem(html, url)
    //   client.index({id:item.id,index:"article",body:item}, (err, resp) => {
    //     if (err) console.error(err.body)
    //     else console.log(resp.body)
    //   })
    //   // itemStream.write(url.href)
    //   // itemStream.write(html)
    // }).catch((err) => {
    //   console.error(err.message)
    // })
  }
  // itemStream.on("data", (chunk) => {
  //   try { 
  //     const item = JSON.parse(chunk.toString())
  //   } catch (err) {
  //     console.error(err)
  //   }
  // })
  // itemStream.on("end", () => {
  //   console.log("passthrough ended")
  // })
}

main()