'use strict'
const getMeta = (doc, name) => {
  const metas = doc.querySelectorAll("meta")
  for (const meta of metas) {
    for (const attr of meta.attributes) {
      if (attr.name === "property") {
        if (attr.value == name) {
          return meta.attributes["content"].value
        }
      }
    }
  }
  return null
}

const getValue = (element) => {
  if (element && element.attributes) {
    if (element.attributes["content"]) {
      return element.attributes["content"].value
    } else if (element.attributes["value"]) {
      return element.attributes["value"]
    }
  }
  return null
}

const getType = (doc) => {
  return getMeta(doc, "og:type")
}

const getTimestamp = (doc) => {
  let element = getMeta(doc, "article:published_time")
  if (!element) element = getMeta(doc, "og:article:published_time")
  if (!element) element = getMeta(doc, "datePublished")
  if (!element) element = getMeta(doc, "timestamp")
  return Date.parse(element)
}

const getTitle = (doc) => {
  return getMeta(doc, "og:title")
}

const getAuthor = (doc) => {
  let element = getMeta(doc, "og:author")
  if (!element) element = getMeta(doc, "author")
  if (!element) element = getMeta(doc, "og:article:author")
  if (!element) element = getMeta(doc, "article:author")
  return element
}

const getDescription = (doc) => {
  let element = getMeta(doc, "og:description")
  if (!element) element = getMeta(doc, "description")
  if (!element) element = getMeta(doc, "article:description")
  if (!element) element = getMeta(doc, "og:article:description")
  return element
}

const getKeywords = (doc) => {
  let element = getMeta(doc, "og:keywords")
  if (!element) element = getMeta(doc, "og:tag")
  if (!element) element = getMeta(doc, "og:tags")
  if (!element) element = getMeta(doc, "keywords")
  if (!element) element = getMeta(doc, "og:article:keywords")
  if (!element) element = getMeta(doc, "article:keywords")
  if (!element) element = getMeta(doc, "tags")
  if (!element) element = getMeta(doc, "tag")
  let values = element
  if (typeof(values) === "string") {
    const keywords = []
    keywords.push(...(values.split(",")))
    return keywords
  }
  return null
}

const getImage = (doc) => {
  let element = getMeta(doc, "og:image")
  if (!element) element = getMeta(doc, "og:img")
  return element
}

module.exports = {
  getType,
  getAuthor,
  getTitle,
  getTimestamp,
  getDescription,
  getKeywords,
  getImage,
}