'use strict'

const DOC = require("./doc")
const hittp = require("hittp")
const { JSDOM } = require("jsdom")
const os = require("os")
const fs = require("fs")

const url = "https://www.cnn.com/2019/10/07/health/germs-home-wellness/index.html"
// const url = "https://www.thestar.com/news/gta/2019/10/16/mayor-john-tory-throws-support-behind-ontario-line-in-deal-with-province-that-would-avoid-subway-upload.html"
// const url = "https://www.scmp.com/week-asia/politics/article/3033238/hong-kongs-snowden-refugees-appeal-trudeau-ahead-canadian"

const stopwords = JSON.parse(fs.readFileSync("./stopwords.json"))

hittp.get(url).then((html) => {
  const dom = new JSDOM(html.toString())
  let body = dom.window.document.body
  const map = new Map()
  countClass(body, map)
  for (const [k, v] of map) {
    if (v.length > 15) {
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

const countClass = (body, map) => {
  const children = body.children
  for (const child of children) {
    if (["SCRIPT", "NOSCRIPT"].includes(child.parentNode.tagName)) continue
    const text = child.textContent
    const isParagraph = getStopWordCount(text) > 3
    if (isParagraph) {
      const classes = child.className.split(" ")
      for (const c of classes) {
        const elements = map.get(c) || []
        elements.push(child.textContent)
        map.set(c, elements)
      }
    }
    countClass(child, map)
  }
}

const countChildren = (body, childrenMap) => {
  let children = body.children
  if (children.length >= 3
    && !["UL", "OL", "A", "BODY"].includes(body.tagName)
    ) {
    childrenMap.set(body, children.length)
  }
  for (const child of children) {
    countChildren(child, childrenMap)
  }
}

const getText = (node, str="") => {
  if (node.nodeType === 3
    && !["A"].includes(node.parentNode.tagName)
    && node.parentNode.children.length < 1
    ) {
    return str.concat(node.textContent).concat(os.EOL)
  } else {
    for (const child of node.childNodes) {
      if (!["UL", "OL", "A", "BODY"].includes(body.tagName)) str = getText(child, str)
    }
    return str
  }
}

const buildMap = (body, map) => {
  const children = body.childNodes
  const elements = map.get(body) || []
  for (const child of children) {
    if (child.tagName === "SCRIPT") continue
    if (child.nodeType === 3
      && ["DIV", "SPAN", "P"].includes(body.tagName)  
      ) {
      elements.push(child.textContent.trim())
    } else {
      buildMap(child, map)
    }
  }
  map.set(body, elements)
}

const bfs = (body, depthMap) => {
  const q = []
  let depth = 0
  q.push({depth, body})
  let item = q.shift()
  while (item !== undefined) {
    const children = Array.from(item.body.children)
    const depth = item.depth
    q.push(...(children.map(c => {
      return {depth:depth+1, body:c}
    })))
    const elements = depthMap.get(depth) || []
    if (["DIV", "SPAN", "P"].includes(item.body.tagName) 
    && item.body.textContent.length > 0
    && item.body.children.length === 0
    ) {
      elements.push(item.body)
    }
    depthMap.set(depth, elements)
    item = q.shift()
  }
}