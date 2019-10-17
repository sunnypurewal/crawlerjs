const hittp = require("hittp")
const htmlparser2 = require("htmlparser2")
const extractor = require("a-extractor")

// const urlstring = "https://khn.org/news/warren-trots-out-her-own-harvard-law-research/"
const urlstring = "https://www.cnn.com/2019/10/07/health/germs-home-wellness/index.html"

const url = hittp.str2url(urlstring)
hittp.stream(url).then((httpstream) => {
  const parser = htmlparser2.createDomStream((err, dom) => {
    const a = extractor.extract(dom[1], url.href)
    console.log(a)
  })
  httpstream.pipe(parser)
}).catch((err) => {
  console.error(err)
})