const http = require("http")
const queryString = require("querystring")
const gpio = require("onoff").Gpio

const rangeMode = /^[0-2]+$/
const rangeDigi = /^\d$/

const digiA = new gpio(5, 'out')
const digiB = new gpio(6, 'out')
const digiC = new gpio(13, 'out')
const digiD = new gpio(19, 'out')
const digis = [digiA, digiB, digiC, digiD];

let gpioDatas = {
  mode: 0,
  digi: 0,
  sync: false
}

function digiUpdate() {
  if (gpioDatas.mode === 0) {
    digis.forEach(function(currentValue) {
      currentValue.writeSync(1)
    })
  } else if (gpioDatas.mode === 1) {
    digiNumber(gpioDatas.digi)
  } else if (gpioDatas.mode === 2) {
    digiLoading()
  } else {
    gpioDatas.mode = 0
  }
}

setInterval(digiUpdate, 100)

function digiNumber(number) {
  digis.forEach(function(currentValue) {
    currentValue.writeSync(number % 2)
    number = parseInt(number / 2)
  })
}

function digiLoading() {
  digiA.writeSync(gpioDatas.digi % 2)
  digiB.writeSync(1)
  digiC.writeSync(0)
  digiD.writeSync(1)
  if (gpioDatas.digi >= 9) {
    gpioDatas.digi = 0
  } else {
    ++ gpioDatas.digi
  }
}

requestHandler = (request, response) => {
  console.log(request.method + " Request: " + request.url)

  if (request.url === "/get" && request.method === "GET") {

    response.setHeader("Content-Type", "application/json")
    response.end(JSON.stringify(gpioDatas))

  } else if (request.url === "/set" && request.method === "POST") {

    let getDatas = [];
    request.on('data', (chunk) => {
      getDatas.push(chunk)
    }).on('end', () => {
      getDatas = queryString.parse(getDatas.toLocaleString());
      console.log("POST: ", getDatas);

      if (rangeMode.test(getDatas.mode)) {
        gpioDatas.mode = parseInt(getDatas.mode)
      }

      if (rangeDigi.test(getDatas.digi)) {
        gpioDatas.digi = parseInt(getDatas.digi)
      }

      if (getDatas.sync === "true") {
        gpioDatas.sync = true
      } else if (getDatas.sync === "false") {
        gpioDatas.sync = false
      }

      response.setHeader("Content-Type", "application/json")
      response.end(JSON.stringify(gpioDatas))
    })

  } else {
    response.end("Use HTTP GET method request '/get' or POST method request '/set'.");
  }
}

const server = http.createServer(requestHandler)
server.listen(3000)
