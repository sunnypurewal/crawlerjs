'use strict'

const dump = (array, client) => {
  return new Promise((resolve, reject) => { 
    console.log("***** DUMPING ******", array.length)
    array.forEach((val) => {
      client.index({id:val.id, index:"article", body:val})
    })
    // const bulkitems = array.flatMap((i) => {
    //   return [
    //     {
    //       index: {
    //         _index: "article",
    //         _id: i.id
    //       }
    //     },
    //     i
    //   ]
    // })
    // console.log(`Dumping ${bulkitems.length/2} into elastic`)

    // client.bulk({
    //   body: bulkitems,
    //   refresh: true,
    //   timeout: 1000
    // }, (err, resp) => {
    //   if (err) reject(err)
    //   else resolve(resp)
    // })
  })
}

module.exports = {
  dump
}