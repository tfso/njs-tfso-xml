const DOMImplementation = require('@xmldom/xmldom').DOMImplementation
const XMLSerializer = require('@xmldom/xmldom').XMLSerializer
const DOMParser = require('@xmldom/xmldom').DOMParser
const XmlReader = require('./XmlReader')

class XmlWriter{
    /**
     * @param {Document} doc
     * @param {Element} elem
     */
    constructor(doc, elem){
        this._doc = doc
        this._elem = elem
    }

    /**
     * @param namespace
     * @param namespaceURI
     * @param schemaLocation
     * @param documentName
     * @returns {XmlWriter}
     */
    static create(namespace, namespaceURI, schemaLocation, documentName = 'Document'){
        const {xmlWriter, doc, documentElement} = this.createRaw(namespace, documentName, 'version="1.0" encoding="utf-8"')

        if(namespaceURI && schemaLocation){
            documentElement.setAttribute('xmlns:xsi', namespaceURI)
            documentElement.setAttribute('xsi:schemaLocation', schemaLocation)
        }

        return xmlWriter
    }

    static createRaw(namespace, documentName, processingIntruction = 'version="1.0" encoding="utf-8"') {
        const dom = new DOMImplementation()
        const doc = dom.createDocument(namespace, documentName)

        doc.insertBefore(doc.createProcessingInstruction('xml', processingIntruction), doc.documentElement)
        const documentElement = doc.documentElement

        const xmlWriter = new XmlWriter(doc, documentElement)

        return {xmlWriter, doc, documentElement}
    }

    /**
     * @param {XmlReader} reader
     * @returns {*}
     */
    static fromReader(reader){
        const writer = XmlWriter.create('', '', '', reader.currentTag)

        /**
         * @param {XmlReader} reader
         * @param {XmlWriter} writer
         */
        let write = (reader, writer) => {
            for(let key of reader.keys()){
                for(let obj of reader.asArray(key)){
                    const writeChildren = nextWriter => write(obj, nextWriter)
                    writer.add(key, writeChildren, obj.attributes(), obj.val())
                }
            }
        }

        write(reader, writer)

        return writer
    }

    /**
     * @callback elementCallback
     * @param {XmlWriter}
     */

    /**
     * @param {string} path
     * @param {elementCallback|*} valueOrFunctionOrNull
     * @param {Object|null} attributes
     * @param value
     * @returns {XmlWriter}
     */
    add(path, valueOrFunctionOrNull = null, attributes = null, value = null){
        this.addAndGet(path, valueOrFunctionOrNull, attributes, value)
        return this
    }

    /**
     * Ex:
     *      // simple element creation
     *      writer.adds('node', ['a','b'])
     *      <node>a<node>
     *      <node>b<node>
     *      // or a custom element creation
     *      writer.adds('node', ['a','b'], (node, str) => node
     *            .add('Id', str)
     *      )
     *      <node><Id>a</Id><node>
     *      <node><Id>b</Id><node>
     * @param {string} path
     * @param {Array} values
     * @param {elementCallback|*} valueOrFunctionOrNull
     * @param {Object|null} attributes
     * @returns {XmlWriter}
     */
    adds(path, values, valueOrFunctionOrNull = null, attributes = null){
        valueOrFunctionOrNull = valueOrFunctionOrNull || ((writer, value) => writer.setVal(value))
        values.forEach(value =>{
            this.addAndGet(path, (writer) => valueOrFunctionOrNull(writer, value), attributes)
        })

        return this
    }

    /**
     * @param {string} path
     * @param {elementCallback|*} valueOrFunctionOrNull
     * @param {Object|null} attributes
     * @param value
     * @returns {XmlWriter}
     */
    addAndGet(path, valueOrFunctionOrNull = null, attributes = null, value = null){
        const parts = path.split('.')
        const firstPath = parts[0]
        const remainingPath = parts.slice(1).join('.')

        const elem = this._doc.createElementNS(this._doc.documentElement.namespaceURI, firstPath)
        this._elem.appendChild(elem)
        const writer = new XmlWriter(this._doc, elem)

        if(remainingPath.length === 0){
            if(typeof valueOrFunctionOrNull === 'function'){
                if(value !== null){
                    writer.setVal(value)
                }
                valueOrFunctionOrNull(writer)
            }else if(valueOrFunctionOrNull !== null){
                writer.setVal(valueOrFunctionOrNull)
            }

            if(attributes !== null){
                Object.keys(attributes).forEach(name => {
                    writer.setAttr(name, attributes[name])
                })
            }

            return writer
        }

        return writer.addAndGet(remainingPath, valueOrFunctionOrNull, attributes)
    }

    setValRaw(raw){
        const parser = new DOMParser()
        this._elem.appendChild(parser.parseFromString(raw))
        return this
    }

    setVal(value){
        this._elem.textContent = value
        return this
    }

    setAttr(name, value){
        this._elem.setAttribute(name, value)
        return this
    }

    toString(){
        const s = new XMLSerializer()
        return s.serializeToString(this._doc)
    }

    /**
     * toString of the current document element
     */
    toFragmentString(){
        const s = new XMLSerializer()
        return s.serializeToString(this._elem)
    }
}

module.exports = XmlWriter