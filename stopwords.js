const fs = require("fs")

fs.readFile("./stopwords.txt", (err, data) => {
  fs.writeFile("./stopwords.json", JSON.stringify(data.toString().split("\n")), (err) => {
    console.log("WROTE")
  })
})