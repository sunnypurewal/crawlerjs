'use strict'

const dump = (array, client) => {
  return new Promise((resolve, reject) => { 
    console.log("***** DUMPING ******", array.length)
    // array.forEach((val) => {
    //   client.index({id:val.id, index:"article", body:val})
    // })
    let bulkitems = array.flatMap((i) => {
      return [
        {
          index: {
            _index: "article",
            _type: "_doc",
            _id: i.id
          }
        },
        i
      ]
    })
    console.log(`Dumping ${bulkitems.length/2} into elastic`)
    bulkitems = bulkitems.map((b) => {
      return JSON.stringify(b)
    }).join("\n")
    bulkitems = bulkitems.concat("\n")
    console.log(bulkitems)
    client.bulk({
      body: bulkitems
    }, (err, resp) => {
      if (err) reject(err)
      else resolve(resp)
    })
  })
}

module.exports = {
  dump
}