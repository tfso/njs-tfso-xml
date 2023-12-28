const fs = require('fs')
const path = require('path')
const through2 = require('through2')
const streamParse = require('../../src/streamParse')

const filePath = path.join(__dirname, './data', 'big.xml')

const inputStream = fs.createReadStream(filePath)

function getMemUsageInMB() {
    const memUsageBytes = process.memoryUsage().rss
    const memUsage = memUsageBytes / (1024 * 1024)
    return Math.round(memUsage)
}

function logMemory() {
    console.log(getMemUsageInMB() + 'MB')
}

logMemory()
let i = 0
streamParse(inputStream, 'MyTag1').pipe(
    through2.obj(function (chunk, enc, next) {
        if (i % 100000 === 0) {
            logMemory()
        }
        i++
        next()
    })
)
