const hittp = require("hittp")
// const sax = require("readabilitySAX")
// const cheerio = require("cheerio")
// const htmlparser2 = require("htmlparser2")
// const extractor = require("a-extractor")
// const article = require('article')
// const Readability = require("readability")
// const { JSDOM } = require("jsdom")
const Mercury = require("@postlight/mercury-parser")

// const urlstring = "https://khn.org/news/warren-trots-out-her-own-harvard-law-research/"
const urlstring = "https://www.cnn.com/2019/10/07/health/germs-home-wellness/index.html"

const url = hittp.str2url(urlstring)

hittp.get(url).then((html) => {
  Mercury.parse(url.href, {html, contentType: "text"}).then((article) => {
    console.log(article)
  })
})

return
hittp.stream(url).then((httpstream) => {
  const a = article(url.href, (err, res) => {
    console.log(res)
  })
  httpstream.pipe(a)
  // const readable = new sax.Readability()
  // const parser = new htmlparser2.Parser(readable, {})
  // httpstream.pipe(parser)
  // httpstream.on("end", () => {
  //   console.log(readable.getArticle())
  // })
}).catch((err) => {
  console.error(err)
})