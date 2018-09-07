const DOMImplementation = require('xmldom').DOMImplementation
const XMLSerializer = require('xmldom').XMLSerializer

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
        let dom = new DOMImplementation()
        let doc = dom.createDocument(namespace, documentName)

        doc.insertBefore(doc.createProcessingInstruction('xml', 'version="1.0" encoding="utf-8"'), doc.documentElement)
        let documentElement = doc.documentElement

        if(namespaceURI && schemaLocation){
            documentElement.setAttributeNS(namespaceURI, 'xsi:schemaLocation', schemaLocation)
        }

        return new XmlWriter(doc, documentElement)
    }

    /**
     * @param {XmlReader} reader
     * @returns {*}
     */
    static fromReader(reader){
        let writer = XmlWriter.create('', '', '', reader.documentTag)

        /**
         * @param {XmlReader} reader
         * @param {XmlWriter} writer
         */
        let write = (reader, writer) => {
            for(let key of reader.keys()){
                for(let obj of reader.asArray(key)){
                    let writeChildren = nextWriter => write(obj, nextWriter)
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
     * @param {string} path
     * @param {elementCallback|*} valueOrFunctionOrNull
     * @param {Object|null} attributes
     * @param value
     * @returns {XmlWriter}
     */
    addAndGet(path, valueOrFunctionOrNull = null, attributes = null, value = null){
        let parts = path.split('.')
        let firstPath = parts[0]
        let remainingPath = parts.slice(1).join('.')

        let elem = this._doc.createElementNS(this._doc.documentElement.namespaceURI, firstPath)
        this._elem.appendChild(elem)
        let writer = new XmlWriter(this._doc, elem)

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

    setVal(value){
        this._elem.textContent = value
        return this
    }

    setAttr(name, value){
        this._elem.setAttribute(name, value)
        return this
    }

    toString(){
        let s = new XMLSerializer()
        return s.serializeToString(this._doc)
    }
}

module.exports = XmlWriter