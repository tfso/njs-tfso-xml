const fs = require('fs')
const path = require('path')
const through2 = require('through2')
const streamParse = require('../../src/streamParse')

let filePath = path.join(__dirname, './data', 'big.xml')

let inputStream = fs.createReadStream(filePath)

function getMemUsageInMB(){
    let memUsageBytes = process.memoryUsage().rss
    let memUsage = memUsageBytes / (1024 * 1024)
    return Math.round(memUsage)
}

function logMemory(){
    console.log(getMemUsageInMB() + 'MB')
}

logMemory()
let i = 0
streamParse(inputStream, 'MyTag1')
    .pipe(through2.obj(function(chunk, enc, next){
        if(i % 100000 === 0){
            logMemory()
        }
        i++
        next()
    }))