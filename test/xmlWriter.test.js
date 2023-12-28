const XmlReader = require('../src/XmlReader')
const XmlWriter = require('../src/XmlWriter')
const chai = require('chai')

const testData1 = `
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

    it('should inject several simple values', async () => {
        const writer = XmlWriter.create('', '', '', 'Document')

        writer.adds('node', ['a', 'b'])

        chai.expect(writer.toString()).to.deep.equal(
            '<?xml version="1.0" encoding="utf-8"?><Document><node>a</node><node>b</node></Document>'
        )
    })

    it('should inject several custom values with attributes', async () => {
        const writer = XmlWriter.create('', '', '', 'Document')

        const items = ['a', 'b']
        writer.adds('node', items, (node, item) => node.add('id', item), {
            prop: 'yo',
        })

        chai.expect(writer.toString()).to.deep.equal(
            '<?xml version="1.0" encoding="utf-8"?><Document><node prop="yo"><id>a</id></node><node prop="yo"><id>b</id></node></Document>'
        )
    })
})
