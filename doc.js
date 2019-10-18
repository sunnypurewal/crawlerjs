'use strict'
const getMeta = (doc, name) => {
  const metas = doc.querySelectorAll("meta")
  for (const meta of metas) {
    for (const attr of meta.attributes) {
      if (attr.name === "property") {
        if (attr.value == name) {
          return getValue(meta)
        }
      }
    }
  }
  return null
}

const getValue = (element) => {
  if (element && element.attributes) {
    if (element.attributes["content"]) {
      return element.attributes["content"].value.trim()
    } else if (element.attributes["value"]) {
      return element.attributes["value"].value.trim()
    }
  }
  return null
}

const getSchema = (doc) => {
  const scripts = doc.querySelectorAll("script[type='application/ld+json']")
  for (const script of scripts) {
    try {
      const jsonld = JSON.parse(script.textContent)
      let type = jsonld["@type"]
      if (type.toLowerCase().includes("article")) {
        return jsonld
      }
    } catch (err) {
      return null
    }
  }
}

const getType = (doc) => {
  let type = getMeta(doc, "og:type")
  if (!type) type = "other"
  return type
}

const getTimestamp = (doc) => {
  let schema = getSchema(doc)
  if (schema) {
    let datestring = schema["datePublished"]
    if (datestring) {
      let date = Date.parse(datestring)
      if (date != NaN) return date
    }
  }
  let element = getMeta(doc, "article:published_time")
  if (!element) element = getMeta(doc, "og:article:published_time")
  if (!element) element = getMeta(doc, "datePublished")
  if (!element) element = getMeta(doc, "timestamp")
  let date = Date.parse(element)
  if (date != NaN) return date
  return null
}

const getTitle = (doc) => {
  return getMeta(doc, "og:title")
}

const getAuthor = (doc) => {
  let schema = getSchema(doc)
  if (schema) {
    let author = schema["author"]
    if (author && author.name) return author.name
  }
  let element = getMeta(doc, "og:author")
  if (!element) element = getMeta(doc, "author")
  if (!element) element = getMeta(doc, "og:article:author")
  if (!element) element = getMeta(doc, "article:author")
  if (element) return element
  return null
}

const getDescription = (doc) => {
  let schema = getSchema(doc)
  if (schema) {
    let headline = schema["headline"]
    if (headline) return headline
  }
  let element = getMeta(doc, "og:description")
  if (!element) element = getMeta(doc, "description")
  if (!element) element = getMeta(doc, "article:description")
  if (!element) element = getMeta(doc, "og:article:description")
  if (element) return element
  let schema = getSchema(doc)
  if (schema) {
    let description = schema["description"]
    if (description) return description
  }
  return null
}

const getKeywords = (doc) => {
  let keywords = []
  const metas = doc.querySelectorAll("meta")
  for (const meta of metas) {
    for (const attr of meta.attributes) {
      if (attr.name === "property") {
        if (attr.value.toLowerCase().includes("tag") ||
            attr.value.toLowerCase().includes("keyword")) {
          keywords.push(getValue(meta))
        }
      }
    }
  }
  return keywords.length > 0 ? keywords : null
}

const getImage = (doc) => {
  let schema = getSchema(doc)
  if (schema) {
    let image = schema["image"]
    if (typeof(image) === "array" && image.length > 0) {
      image = image[0]
    }
    if (image) {
      if (typeof(image) === "string") return image
      else if (image["@type"] === "ImageObject") {
        return image["url"]
      }
    }
  }
  let element = getMeta(doc, "og:image")
  if (!element) element = getMeta(doc, "og:img")
  if (element) return element
  return null
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