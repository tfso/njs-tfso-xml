const XmlReader = require('../src/XmlReader')
const XmlWriter = require('../src/XmlWriter')
const chai = require('chai')

let testData1 = `
<document>
    <test hello="world">yo</test>
    <list>
        <otheritem>yoyo</otheritem>
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

describe('XmlWriter', () => {
    it('should be able to print a fragment', async () => {
        const reader = await XmlReader.parse(testData1)

        const subReader = reader.asObject('list.item')

        const writer = XmlWriter.fromReader(subReader)

        const finalReader = await XmlReader.parse(writer.toFragmentString())

        chai.expect(finalReader.valAt('nestedlist.nesteditem')).to.equal('1')
    })

    it('should set a raw value', async () => {
        const writer = XmlWriter.create('', '', '', 'Document')

        writer.setValRaw(`
            <test>hello!</test>
        `)

        const reader = await XmlReader.parse(writer.toString())

        chai.expect(reader.valAt('test')).to.equal('hello!')
    })
})