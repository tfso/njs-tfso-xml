const stringToStream = require('../src/stringToStream')
const parse = require('../src/parse')
const streamParse = require('../src/streamParse')
const through2 = require('through2')
const fs = require('fs')
const path = require('path')
const chai = require('chai')

describe('streamParse', () => {
    it('should read sample.xml the same way as parse', async () => {
        let fileContent = fs.readFileSync(path.join(__dirname, 'data/sample.xml'), 'utf-8')

        let expectedData = await parse(fileContent)

        let p = new Promise((resolve, reject) => {
            let output = []
            streamParse(stringToStream(fileContent))
                .on('end', () => resolve(output))
                .on('error', (err) => reject(err))
                .pipe(through2.obj(function(chunk, enc, next){
                    output.push(chunk)
                    next()
                }))
        })

        let output = await p
        chai.expect(output.length).to.equal(1)
        let data = output[0]

        chai.expect(data).to.deep.equal(expectedData)
    })

    it('should read sample2.xml the same way as parse', async () => {
        let fileContent = fs.readFileSync(path.join(__dirname, 'data/sample2.xml'), 'utf-8')

        let expectedData = await parse(fileContent)

        let p = new Promise((resolve, reject) => {
            let output = []
            streamParse(stringToStream(fileContent))
                .on('end', () => resolve(output))
                .on('error', (err) => reject(err))
                .pipe(through2.obj(function(chunk, enc, next){
                    output.push(chunk)
                    next()
                }))
        })

        let output = await p
        chai.expect(output.length).to.equal(1)
        let data = output[0]

        chai.expect(data).to.deep.equal(expectedData)
    })

    it('should throw error if bad xml', async () => {
        let fileContent = '<xml yo!'

        let p = new Promise((resolve, reject) => {
            let output = []
            streamParse(stringToStream(fileContent))
                .on('end', () => resolve(output))
                .on('error', (err) => reject(err))
                .pipe(through2.obj(function(chunk, enc, next){
                    output.push(chunk)
                    next()
                }))
        })
        let error = null
        await p.catch(err => error = err)

        chai.expect(error).to.not.equal(null)
        chai.expect(error.message).to.contain('Invalid attribute')
    })
})