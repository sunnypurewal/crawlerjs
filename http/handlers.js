class GetHandler {

  constructor(res) {
    res.on("data", onData)
    res.on("end", onEnd)
    this.data = []
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
  }

  onEnd() {
    console.log("End")
  }
}