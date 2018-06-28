const http = require("http")
const queryString = require("querystring")
const gpio = require("onoff").Gpio

const rangeMode = /^[0-2]+$/
const rangeDigi = /^\d$/

const LED0 = new gpio(26, 'out');
const LED1 = new gpio(19, 'out');
const LED2 = new gpio(13, 'out');
const LED3 = new gpio( 6, 'out');
const LED4 = new gpio( 5, 'out');
const LED5 = new gpio(11, 'out');
const LED6 = new gpio( 9, 'out');
const LED7 = new gpio(10, 'out');
const LED8 = new gpio(22, 'out');
const LED9 = new gpio(27, 'out');
const LEDs = [LED0, LED1, LED2, LED3, LED4, LED5, LED6, LED7, LED8, LED9];

let gpioDatas = {
  mode: 0,
  digi: 0,
  sync: false
}

function ledUpdate() {
  if (gpioDatas.mode === 0) {
    LEDs.forEach(function(currentValue) {
      currentValue.writeSync(1)
    })
  } else if (gpioDatas.mode === 1) {
    ledNumber(gpioDatas.digi)
  } else if (gpioDatas.mode === 2) {
    ledLoading()
  } else {
    gpioDatas.mode = 0
  }
}

setInterval(ledUpdate, 40)

function ledNumber(number) {
  LEDs.forEach(function(currentValue) {
    if (number + 1 > 0) {
      currentValue.writeSync(0)
    } else {
      currentValue.writeSync(1)
    }
    number = number - 1
  })
}

function ledLoading() {
  LEDs.forEach(function(currentValue) {
    currentValue.writeSync(1)
  })
  LEDs[gpioDatas.digi].writeSync(0)
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
