'use strict'

const DOC = require("./doc")
const hittp = require("hittp")
const { JSDOM } = require("jsdom")
const os = require("os")
const fs = require("fs")
const article = require("article")

// const url = "https://www.cnn.com/2019/10/07/health/germs-home-wellness/index.html"
// const url = "https://www.thestar.com/news/gta/2019/10/16/mayor-john-tory-throws-support-behind-ontario-line-in-deal-with-province-that-would-avoid-subway-upload.html"
// const url = "https://www.scmp.com/week-asia/politics/article/3033238/hong-kongs-snowden-refugees-appeal-trudeau-ahead-canadian"
// const url = "https://www.afp.com/fr/infos/334/f1-environnement-hamilton-attaque-lagriculture-et-se-prend-une-volee-de-bois-vert-doc-1lh1j62"
const url = "https://thepioneerwoman.com/cooking/dark-chocolate-brownies/"

// const stopwords = JSON.parse(fs.readFileSync("./stopwords.json"))

// let start = Date.now()
// hittp.stream(url).then((httpstream) => {
//   httpstream.pipe(article(url, (err, result) => {
//   console.log("ARTICLE", result)
//   // console.log("Time:", (Date.now()-start)/1000)
//   }))
// })
// return

hittp.get(url).then((html) => {
  const dom = new JSDOM(html.toString())
  let body = dom.window.document.body
  const classmap = new Map()
  body = getArticleNode(body) || body
  countClass(body, classmap)
  console.log("CLASSES")
  for (const [k, v] of classmap) {
    if (v.length > 5) {
      console.log(k, v)
    }
  }
  const tagmap = new Map()
  countTag(body, tagmap)
  console.log("TAGS")
  for (const [k, v] of tagmap) {
    if (v.length > 5) {
      console.log(k, v)
    }
  }
})

const getStopWordCount = (string) => {
  let words = string.split(" ")
  const numWords = words.length
  words = words.filter((w) => {
    !stopwords.includes(w)
  })
  const stopwordCount = numWords - words.length
  return stopwordCount
}

const BAD_TAGS = ["A", "SCRIPT", "UL", "OL", "LI", "NOSCRIPT", "META"]
const isParagraph = (element) => {
  if (BAD_TAGS.includes(element.tagName)) return false
  // if (getStopWordCount(element.textContent.trim()) < 3) return false
  // if (element.className.includes("js-gallery-aspect-ratio-wrapper")) {
    // console.log(element.textContent)
    // console.log(element.innerHTML)
  // }
  // const htmlLength = element.innerHTML.length
  // const textLength = element.textContent.length
  // const diff = htmlLength - textLength
  // if (diff > 10) return false
  
  return true
}

const getArticleNode = (body) => {
  let article = body.querySelector("article")
  if (article) return article
  article = body.querySelector("[itemprop='articleBody']")
  if (article) return article
  article = body.querySelector(".article_content")
  if (article) return article
}

const countTag = (body, map) => {
  const children = body.children
  for (const child of children) {
    if (!child.tagName) continue
    const text = child.textContent
    if (isParagraph(child)
    ) {
      const elements = map.get(child.tagName) || []
      elements.push(child.textContent)
      map.set(child.tagName, elements)
    }
    if (!BAD_TAGS.includes(child.tagName)) countTag(child, map)
  }
}

const countClass = (body, map) => {
  const children = body.children
  for (const child of children) {
    if (BAD_TAGS.includes(child.tagName)) continue
    if (isParagraph(child)) {
      const classes = child.className.split(" ")
      for (const c of classes) {
        if (c.length === 0) continue
        const elements = map.get(c) || []
        elements.push(child.textContent)
        map.set(c, elements)
      }
    }
    countClass(child, map)
  }
}