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