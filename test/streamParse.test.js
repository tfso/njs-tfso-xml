const stringToStream = require('../src/stringToStream')
const parse = require('../src/parse')
const streamParse = require('../src/streamParse')
const through2 = require('through2')
const fs = require('fs')
const path = require('path')
const chai = require('chai')

describe('streamParse', () => {
    it('should read sample.xml the same way as parse', async () => {
        const fileContent = fs.readFileSync(
            path.join(__dirname, 'data/sample.xml'),
            'utf-8'
        )

        const expectedData = await parse(fileContent)

        const p = new Promise((resolve, reject) => {
            const output = []
            streamParse(stringToStream(fileContent))
                .on('end', () => resolve(output))
                .on('error', (err) => reject(err))
                .pipe(
                    through2.obj(function (chunk, enc, next) {
                        output.push(chunk)
                        next()
                    })
                )
        })

        const output = await p
        chai.expect(output.length).to.equal(1)
        const data = output[0]

        chai.expect(data).to.deep.equal(expectedData)
    })

    it('should read sample2.xml the same way as parse', async () => {
        const fileContent = fs.readFileSync(
            path.join(__dirname, 'data/sample2.xml'),
            'utf-8'
        )

        const expectedData = await parse(fileContent)

        const p = new Promise((resolve, reject) => {
            const output = []
            streamParse(stringToStream(fileContent))
                .on('end', () => resolve(output))
                .on('error', (err) => reject(err))
                .pipe(
                    through2.obj(function (chunk, enc, next) {
                        output.push(chunk)
                        next()
                    })
                )
        })

        const output = await p
        chai.expect(output.length).to.equal(1)
        const data = output[0]

        chai.expect(data).to.deep.equal(expectedData)
    })

    it('should throw error if bad xml', async () => {
        const fileContent = '<xml yo!'

        const p = new Promise((resolve, reject) => {
            const output = []
            streamParse(stringToStream(fileContent))
                .on('end', () => resolve(output))
                .on('error', (err) => reject(err))
                .pipe(
                    through2.obj(function (chunk, enc, next) {
                        output.push(chunk)
                        next()
                    })
                )
        })
        let error = null
        await p.catch((err) => (error = err))

        chai.expect(error).to.not.equal(null)
        chai.expect(error.message).to.contain('Invalid attribute')
    })
})
