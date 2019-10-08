'use strict'
const fs = require("fs").promises
const hittp = require("hittp")
const crypto = require("crypto")
const DOC = require("./doc")
const { JSDOM } = require("jsdom")

const main = async () => {
  let urlstrings = null
  try {
    const articlefile = await fs.open("./data/items/article.jsonlines", "w")
    // const videofile = await fs.open("./data/items/videofile.jsonlines", "a+")
    const otherfile = await fs.open("./data/items/other.jsonlines", "w")
    const buffer = await fs.readFile("./data/recent.urlset")
    urlstrings = buffer.toString().split("\n")
  } catch (err) {
    console.error(err)
    return
  }
  if (urlstrings.length === 0) {
    console.error("No URL strings")
    return
  }
  for (const urlstring of urlstrings) {
    const urlobj = JSON.parse(urlstring)
    let url = hittp.str2url(urlobj["loc"])
    // url = hittp.str2url("https:/www.reuters.com/article/britain-stocks/growth-worries-brexit-woes-hit-ftse-100-gambling-stocks-rally-on-ma-news-idUSL3N26N1JX")
    const doc = null
    try {
      const html = await hittp.get(url)
      const dom = new JSDOM(html)
      doc = dom.window.document
    } catch (err) {
      continue
    }
    let item = new Item(url)
    item.type = DOC.getType(doc)
    if (item.type === "article" || item.type === "website") {
      item = new Article(item)
      const pElements = doc.querySelectorAll("p")
      for (const pElement of pElements) {
        // item.addParagraph(pElement.textContent)
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
      if (imgurl) item.imgurl = hittp.str2url(imgurl)
      const jsonstring = JSON.stringify(item)
      await articlefile.writeFile(`${jsonstring}
`)
    } else {
      const jsonstring = JSON.stringify(item)
      try {
        await otherfile.writeFile(`${jsonstring}
`)
      } catch (err) {
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

main()


class Item {
  constructor(url, id=null, type=null) {
    this.url = url
    if (!id) {
      const hash = crypto.createHash("sha256")
      hash.update(url.pathname)
      if (url.search.length > 0) {
        hash.update(url.search)
      }
      this.id = hash.digest("hex")
    }
    this.type = type
  }
}

class Article extends Item {
  constructor(item) {
    super(item.url, item.id)
    this.paragraphs = []
    this.type = "article"
  }
  addParagraph(paragraph /*:string*/) {
    this.paragraphs.push(paragraph)
  }
  addParagraphs(paragraphs /*:array*/) {
    this.paragraphs.push(...paragraphs)
  }
  toString() {
    return this.paragraphs.join("\n")
  }
}