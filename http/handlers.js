class GetHandler {

  constructor(res, got) {
    this.data = new Array()
    this.got = got
    console.log("Constructor handlers")
    res.on("data", this.onData)
    res.on("end", this.onEnd)
  }

  onAbort() {
    console.log("Abort")
  }

  onConnect(response, socket, head) {
    console.log("Connect")
  }

  onResponse(response) {
    console.log("Response")
  }

  onTimeout() {
    console.log("Timeout")
  }

  onData(chunk) {
    console.log("Data")
    this.data.push(chunk)
  }

  onEnd() {
    console.log("End")
    buffer = Buffer.concat(this.data)
    this.got(buffer)
  }
}

module.exports = {
  GetHandler
}