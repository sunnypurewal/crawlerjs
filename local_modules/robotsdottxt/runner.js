'use strict'


const run = async (urls) => {
  const bots = []
  let i = 0
  for (const domain of urls) {
    robots.get(domain).then(robot => {
      if (robot != null) {
        bots.push(robot)
      }
      i++
    })
  }
  while (i < urls.length) await sleep(500)
  return bots
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  run
}