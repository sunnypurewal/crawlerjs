const { Worker, isMainThread, parentPort } = require('worker_threads');

parentPort.on("message", (msg) => {
  console.log("Received message", Date.now())
})