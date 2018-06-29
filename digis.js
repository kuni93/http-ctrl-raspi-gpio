// 引入相關套件、函式庫
// 其中 onoff 無內建請先使用 `npm install onoff --save` 安裝
const http = require('http')
const queryString = require('querystring')
const gpio = require('onoff').Gpio

// 定義要使用的 GPIO
const digiA = new gpio(5, 'out')
const digiB = new gpio(6, 'out')
const digiC = new gpio(13, 'out')
const digiD = new gpio(19, 'out')
const digis = [digiA, digiB, digiC, digiD]

// 定義及初始化模式、顯示數字、同步
const rangeMode = /^[0-2]+$/
const rangeDigi = /^\d$/

let gpioData = {
  mode: 0,
  digi: 0,
  sync: false
}

// 定義同步計時器及目標位置
let syncInterval
let syncSource = 'http://{{IP}}:{{PORT}}}/{{PATH}}'

// 每 100ms 更新一次七段顯示器電路
function digiUpdate() {
  if (gpioData.mode === 0) {
    digis.forEach(function(currentValue) {
      currentValue.writeSync(1)
    })
  } else if (gpioData.mode === 1) {
    digiNumber(gpioData.digi)
  } else if (gpioData.mode === 2) {
    digiLoading()
  } else {
    gpioData.mode = 0
  }
}

setInterval(digiUpdate, 100)

// 輸出二進制到 7447 IC 解碼
function digiNumber(number) {
  digis.forEach(function(currentValue) {
    currentValue.writeSync(number % 2)
    number = parseInt(number / 2)
  })
}

// 輸出動畫到 7447 IC 解碼
function digiLoading() {
  digiA.writeSync(gpioData.digi % 2)
  digiB.writeSync(1)
  digiC.writeSync(0)
  digiD.writeSync(1)
  if (gpioData.digi >= 9) {
    gpioData.digi = 0
  } else {
    ++ gpioData.digi
  }
}

// 用 HTTP GET 取得目標來源的狀態
function getSync() {
  http.get(syncSource, (res) => {
    let syncData = ''

    res.on('data', (chunk) => {
      syncData += chunk
    })

    res.on('end', () => {
      gpioData.mode = JSON.parse(syncData).mode // 解析 JSON 格式
      gpioData.digi = JSON.parse(syncData).digi // 解析 JSON 格式
    })

  }).on('error', (err) => {
    console.log('Error: ' + err.message)
  })
}

requestHandler = (request, response) => {
  console.log(request.method + ' Request: ' + request.url)

  if (request.url === '/get' && request.method === 'GET') {

    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(gpioData))

  } else if (request.url === '/set' && request.method === 'POST') {

    let getData = []
    request.on('data', (chunk) => {
      getData.push(chunk)
    }).on('end', () => {
      getData = queryString.parse(getData.toLocaleString())
      console.log('POST: ', getData)

      if (rangeMode.test(getData.mode)) { // 用正規表示式檢查傳入的參數
        gpioData.mode = parseInt(getData.mode)
      }

      if (rangeDigi.test(getData.digi)) { // 用正規表示式檢查傳入的參數
        gpioData.digi = parseInt(getData.digi)
      }

      if (getData.sync === 'true') {
        gpioData.sync = true
        syncInterval = setInterval(getSync, 500)
      } else if (getData.sync === 'false') {
        gpioData.sync = false
        clearInterval(syncInterval)
      }

      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify(gpioData))
    })

  } else {
    response.end('Use HTTP GET method request `/get` or POST method request `/set`.')
  }
}

const server = http.createServer(requestHandler)
server.listen(3000) // 啟動 HTTP Server
