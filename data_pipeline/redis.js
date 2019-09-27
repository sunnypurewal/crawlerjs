const redis = require("redis")

const client = redis.createClient();

client.on("subscribe", (channel, count) => {

})

client.on("message", (channel, message) => {
  
})