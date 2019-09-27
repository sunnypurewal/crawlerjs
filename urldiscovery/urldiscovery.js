'use strict'

const jsonfile = require("jsonfile")

const fromJSON = async (filename) => {
  try {
    const obj = await jsonfile.readFile(filename)
    const domains = []
    const categories = Object.keys(obj)
    for (const cat of categories) {
      const urlList = obj[cat]
      for (const u of urlList) {
        domains.push(u)
      }
    }
    return domains
  } catch (error) {
    console.error(error)
    return []
  }
}

module.exports = {
  fromJSON: fromJSON
}