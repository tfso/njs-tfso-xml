const XmlReader = require('../src/XmlReader')
const through2 = require('through2')
const fs = require('fs')
const path = require('path')
const chai = require('chai')

async function parseWithStream(data, splitOn){
    return new Promise((resolve, reject) => {
        let readers = []
        XmlReader.streamParseFromString(data, splitOn)
            .on('end', () => resolve(readers))
            .on('error', (err) => reject(err))
            .pipe(through2.obj(function(chunk, enc, next){
                readers.push(chunk)
                next()
            }))
    })
}

let testData1 = `
<document>
    <test hello="world">yo</test>
    <list>
        <item>
            <nestedlist>
                <nesteditem attr="attr1">1</nesteditem>
                <nesteditem attr="attr2">2</nesteditem>
            </nestedlist>
        </item>
        <item>
            <nestedlist>
                <nesteditem attr="attr3">3</nesteditem>
                <nesteditem attr="attr4">4</nesteditem>
            </nestedlist>
        </item>
    </list>
</document>
`

describe('XmlReader', () => {
    it('should read+write+read sample file and give the same result', async () => {
        let data = fs.readFileSync(path.join(__dirname, 'data/sample.xml'), 'utf-8')

        let reader = (await parseWithStream(data))[0]

        let xmlStr = reader.toString()

        let readerAgain = (await parseWithStream(xmlStr))[0]

        chai.expect(reader.data).to.deep.equal(readerAgain.data)
    })

    it('should read+write+read sample file using xml2js and give the same result', async () => {
        let data = fs.readFileSync(path.join(__dirname, 'data/sample.xml'), 'utf-8')

        let reader = await XmlReader.parse(data)

        let xmlStr = reader.toString()

        let readerAgain = await XmlReader.parse(xmlStr)

        chai.expect(reader.data).to.deep.equal(readerAgain.data)
    })

    it('should read some basic things', async () => {
        let reader = await XmlReader.parse(testData1)

        chai.expect(
            reader.attributeAt('test', 'hello')
        ).to.equal('world')

        chai.expect(
            reader.valAt('list.item.nestedlist.nesteditem')
        ).to.equal('1')

        chai.expect(
            reader.has('list')
        ).to.equal(true)

        chai.expect(
            reader.has('blarg')
        ).to.equal(false)

        chai.expect(
            reader.asArray('list.item.nestedlist.nesteditem').map(r => r.val())
        ).to.deep.equal(['1', '2'])

        chai.expect(
            reader.asArray('list.item.nestedlist.nesteditem').map(r => r.attribute('attr'))
        ).to.deep.equal(['attr1', 'attr2'])

        chai.expect(
            reader.asArrayAll('list.item.nestedlist.nesteditem').map(r => r.val())
        ).to.deep.equal(['1', '2', '3', '4'])
    })

    it('should parse some basic stuff by stream', async () => {
        let readers = await parseWithStream(testData1, 'list.item')

        chai.expect(
            readers[0].valAt('test')
        ).to.equal('yo')

        chai.expect(
            readers[0].asArrayAll('list.item.nestedlist.nesteditem').map(r => r.val())
        ).to.deep.equal(['1', '2'])

        chai.expect(
            readers[1].valAt('test')
        ).to.equal('yo')

        chai.expect(
            readers[1].asArrayAll('list.item.nestedlist.nesteditem').map(r => r.val())
        ).to.deep.equal(['3', '4'])
    })
})