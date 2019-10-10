const { Client } = require("@elastic/elasticsearch")
const client = new Client({node: "http://127.0.0.1:9200"})
const fs = require("fs").promises

client.indices.delete({
  index: "article", 
  ignoreUnavailable: true
}, (err, resp, status) => {
  console.log("Deleted old index", resp.body)
  fs.readFile("./mapping.json").then((mapping) => {
    mapping = JSON.parse(mapping.toString())
    client.indices.create(mapping, ((err, resp, status) => {
      console.log("Created new index", resp.body)
    }))
  })
})