'use strict'
const fs = require("fs").promises
const hittp = require("hittp")
const crypto = require("crypto")
const DOC = require("./doc")
const { JSDOM } = require("jsdom")
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

const main = async () => {

  await client.indices.delete({
    index: "article",
    ignoreUnavailable: true
  })
  let mapping = `
  {
    "index": "article",
    "body": {
      "settings": {
        "number_of_replicas": 0,
        "number_of_shards": 1
      },
      "mappings": {  
        "properties": {
          "author": {
            "type": "text",
            "index": false
          },
          "body": {
            "type": "text"
          },
          "description": {
            "type": "text"
          },
          "id": {
            "type": "text"
          },
          "imgurl": {
            "type": "text",
            "index": false
          },
          "score": {
            "type": "long",
            "index": false
          },
          "type": {
            "type": "keyword"
          },
          "tags": {
            "type": "keyword"
          },
          "timestamp": {  
            "type":"date",
            "format":"epoch_second"
          },
          "title": {
            "type":"text"
          },
          "url": {
            "type":"text",
            "index": false
          }
        }
      }
    }
  }`
  mapping = JSON.parse(mapping)
  let create = await client.indices.create(mapping)
  console.log(create.body)
  let exists = await client.indices.exists({index:"article"})
  console.log(exists.body)
  let urlstrings = null
  let articlefile = null, otherfile = null, buffer = null
  try {
    articlefile = await fs.open("./data/items/article.jsonlines", "w")
    // const videofile = await fs.open("./data/items/videofile.jsonlines", "a+")
    otherfile = await fs.open("./data/items/other.jsonlines", "w")
    buffer = await fs.readFile("./data/recent.urlset")
    urlstrings = buffer.toString().split("\n")
  } catch (err) {
    console.error(err)
    return
  }
  if (urlstrings.length === 0) {
    console.error("No URL strings")
    return
  }
  // urlstrings = [`{"loc":"https://www.santacruzsentinel.com/2019/10/04/business-digest-dominican-hospital-family-reunion-set-on-sunday/"}`]
  for (const urlstring of urlstrings) {
    const urlobj = JSON.parse(urlstring)
    let url = hittp.str2url(urlobj["loc"])
    // url = hittp.str2url("https:/www.reuters.com/article/britain-stocks/growth-worries-brexit-woes-hit-ftse-100-gambling-stocks-rally-on-ma-news-idUSL3N26N1JX")
    let doc = null
    try {
      const html = await hittp.get(url)
      const dom = new JSDOM(html)
      doc = dom.window.document
    } catch (err) {
      console.error(err)
      continue
    }
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
      if (imgurl) item.imgurl = hittp.str2url(imgurl).origin
      try {
        let index = await client.index({id:item.id,index:"article",body:item})
        console.log(index.body["_shards"].successful, item.id)
      } catch (err) {
        console.error(err.body, item)
        continue
      }
    } else {
      try {
        let index = await client.index({id:item.id,index:"article",body:JSON.stringify(item)})
        console.log(index.body["_shards"].successful, item.id)
      } catch (err) {
        console.error(err)
        continue
      }
    }
  }
}

  
// item["timestamp"] = int(dateparser.parse(published_time).timestamp())
// title = response.xpath("//meta[@property='og:title']/@content").get()
// if title is None or len(title) == 0:
//   return
// item["title"] = title
// image = response.xpath("//meta[@property='og:image']/@content").get()
// if image is not None and len(image) > 0:
//   item["imgurl"] = image
// description = response.xpath("//meta[@property='description']").get()
// if description is not None and len(description) > 0:
//   item["description"] = description
// tags = response.xpath("//meta[@property='article:tag'] | //meta[@property='og:article:tag']")
// if tags is not None and len(tags) > 0:
//   t = []
//   for tag in tags:
//     t.append(tag.xpath("@content").get().strip())
//   item["tags"] = t
// else:
//   tags = response.xpath("//meta[@property='article:tags'] | //meta[@property='og:article:tags']")
//   if isinstance(tags, list):
//     t = []
//     for tagcsv in tags:
//       for tagv in tagcsv.split(","):
//         t.append(tagv.strip())
//     item["tags"] = t
// author = response.xpath("//meta[@property='article:author'] | //meta[@property='article:author'] | //meta[@property='og:article:author'] | //meta[@property='og:article:author']").xpath("@content").get()
// if author is not None and len(author) > 0:
//   item["author"] = author



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

main()