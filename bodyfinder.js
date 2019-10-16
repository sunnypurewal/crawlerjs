'use strict'

const DOC = require("./doc")
const hittp = require("hittp")
const { JSDOM } = require("jsdom")
const os = require("os")
const jquery = require("jquery")

const url = hittp.str2url("https://www.cnn.com/2019/10/07/health/germs-home-wellness/index.html",)

hittp.get(url).then((html) => {
  const dom = new JSDOM(html.toString(), {pretendToBeVisual: true, url: url.origin})
  const $ = jquery(dom.window)
  try {
    console.log($("body").css)
  } catch (err) {
    console.error(err)
  }
  // const body = dfs($, $("body"))
  // const body = dfs(dom.window.document.body)
  // console.log(body)
})

const dfs = ($, body) => {
// const dfs = (body) => {
  if (!body) return
  for (const child of body.contents()) {
    if ($(child).css()) {
      console.log(child.tagName, $(child).css())
    } else {
      console.log(child.tagName, "NOSTYLE")
    }
  }
}

// const dfs = ($, $body) => {
//   const children = $body.children)
//   console.log(children.length)
// }

// const dfs = (doc, str="") => {
//   if (doc.nodeType === 3 
//     && doc.parentNode 
//     && ["DIV", "SPAN", "P"].includes(doc.parentNode.tagName)
//     ) {
//     console.log(doc.parentNode.style.getProperty("display"))
//     return str.concat(doc.textContent).concat(os.EOL)
//   } else {
//     for (const child of doc.childNodes) {
//       str = dfs(child, str)
//     }
//     return str
//   }
// }

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