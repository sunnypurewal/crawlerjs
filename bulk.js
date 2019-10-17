'use strict'
const crypto = require("crypto")
const stream = require("stream")
const hittp = require("hittp")
const DOC = require("./doc")
const { JSDOM } = require("jsdom")
const article = require("article")

const getItem = (html, url) => {
  let options = {}
  let parsedurl = hittp.str2url(url)
  if (parsedurl) options.url = parsedurl.origin
  const dom = new JSDOM(html, options)
  let doc = dom.window.document
  let item = new Item(url)
  item.type = DOC.getType(doc)
  if (item.type === "article" || item.type === "website") {
    item = new Article(url, item.id)
    const pElements = doc.querySelectorAll("p")
    for (const pElement of pElements) {
      let content = pElement.textContent.trim()
      if (content.length > 0) {
        item.addParagraph(content)
      }
    }
    item.title = DOC.getTitle(doc)
    const timestamp = DOC.getTimestamp(doc)
    if (timestamp) item.timestamp = timestamp
    const author = DOC.getAuthor(doc)
    if (author) item.author = author
    const keywords = DOC.getKeywords(doc)
    if (keywords) item.keywords = keywords
    const description = DOC.getDescription(doc)
    if (description) item.description = description
    const imgurl = DOC.getImage(doc)
    if (imgurl) item.imgurl = hittp.str2url(imgurl).href
  }
  return item
}

class ItemStream extends stream.Writable {
  constructor(options) {
    super(options)
    this.url = null
    this.html = null
  }

  _write = (chunk, enc, cb) => {
    const chunkstring = chunk.toString()
    this.url = hittp.str2url(chunkstring)
    if (!this.url) {
      this.html = chunkstring
    }
    if (this.url && this.html) {
      const item = getItem()
      this.url = null
      this.html = null
    } else {
      cb()
    }
  }
}

class Item {
  constructor(url, id=null, type=null) {
    this.url = url.href
    if (!id) {
      const hash = crypto.createHash("sha256")
      hash.update(url.pathname)
      if (url.search.length > 0) {
        hash.update(url.search)
      }
      this.id = hash.digest("hex")
    } else {
      this.id = id
    }
    this.type = type
  }
}

class Article extends Item {
  constructor(url, id) {
    super(url, id)
    this.body = null
    this.type = "article"
  }
  addParagraph(paragraph /*:string*/) {
    if (this.body) {
      this.body = this.body.concat("\n", paragraph)
    } else {
      this.body = paragraph
    }
  }
  addParagraphs(paragraphs /*:array*/) {
    this.paragraphs.push(...paragraphs)
  }
}

module.exports = {
  ItemStream,
  Item,
  Article,
  getItem
}