'use strict'

const DOC = require("./doc")
const hittp = require("hittp")
const { JSDOM } = require("jsdom")

// const url = hittp.str2url("https://www.cnn.com/2019/10/07/health/germs-home-wellness/index.html")
const url = "https://www.thestar.com/news/gta/2019/10/16/mayor-john-tory-throws-support-behind-ontario-line-in-deal-with-province-that-would-avoid-subway-upload.html"

hittp.get(url).then((html) => {
  const dom = new JSDOM(html.toString())
  let doc = dom.window.document
  const body = doc.querySelector(".article-content-container")
  const depthMap = new Map()
  dfs(body, depthMap)
  for (const [k,v] of depthMap) {
    console.log(k, v)
  }
})

const dfs = (body, depthMap, depth=0) => {
  const children = body.childNodes
  const elements = depthMap.get(depth) || []
  for (const child of children) {
    // if (!child.tagName) continue
    if (child.nodeType === 3
      && ["DIV", "SPAN", "P"].includes(body.tagName)  
      ) {
      elements.push(child.textContent.trim())
    } else {
      dfs(child, depthMap, depth+1)
    }
  }
  depthMap.set(depth, elements)
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