# njs-tfso-xml (public)

Utilities for reading and writing xml (public)

# Usage

## Reader

````js
const XmlReader = require('njs-tfso-xml').XmlReader

let data = `
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

async function main(){
    let reader = await XmlReader.parse(data)
    
    reader.attributeAt('test', 'hello')
    // 'world'
    
    reader.valAt('list.item.nestedlist.nesteditem')
    // '1'
    
    reader.has('list')
    // true
    
    reader.has('blarg')
    // false
    
    reader.asArray('list.item.nestedlist.nesteditem').map(r => r.val())
    // ['1', '2']
    
    reader.asArray('list.item.nestedlist.nesteditem').map(r => r.attribute('attr'))
    // ['attr1', 'attr2']
    
    reader.asArrayAll('list.item.nestedlist.nesteditem').map(r => r.val())
    // ['1', '2', '3', '4']
}
````

Utils

* static parse(xmlString) -> Parses an xml string and returns a promise with an XmlReader
* static streamParseFromString(xmlString, splitOn) -> Parses as string, but will break the file up on the splitOn path
* static streamParse(inputStream, splitOn) -> Parses as string from given stream, but will break the file up on the splitOn path
  splitOn is a dot-separated path (for example 'list.item').
  The return value is a readable object stream that pushes XmlReaders.

* val(defaultValue) -> Returns current text value
* valAt(path, defaultValue) -> Returns text value at path
* attribute(name, defaultValue) -> Returns attribute by name
* attributes() -> Returns all attrbiutes
* attributeAt(path, name, defaultValue) -> Returns attribute at path and name of attribute
* has(path) -> Check if path exists
* keys(path) -> List all children tags (one level deep)
* asObject(path) -> Create a new XmlReader starting at the given path
* asArray(path) -> Create an array of XmlReader's at the given path
* asArrayAll(path) -> Same as asArray, except this will traverse all possible nodes to get there, not just the first
* toString() -> Returns the current reader data as an xml string. This may not make sense unless you're at the root element

The documentTag can be found at reader.documentTag. Paths are excluded the documentTag.

### Example using streaming parser

````js
const XmlReader = require('njs-tfso-xml').XmlReader
const through2 = require('through2')

let data = `
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

async function main(){
    let splitOn = 'list.item'
    
    let readers = await new Promise((resolve, reject) => {
        let readers = []
        XmlReader.streamParseFromString(data, splitOn)
            .on('end', () => resolve(readers))
            .on('error', (err) => reject(err))
            .pipe(through2.obj(function(chunk, enc, next){
                readers.push(chunk)
                next()
            }))
    })

    readers[0].valAt('test') 
    // yo
    
    readers[0].asArrayAll('list.item.nestedlist.nesteditem').map(r => r.val())
    // ['1', '2']
    
    readers[1].valAt('test')
    // yo
    
    readers[1].asArrayAll('list.item.nestedlist.nesteditem').map(r => r.val())
    // ['3', '4']
}
````