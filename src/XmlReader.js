const _ = require('lodash')
const through2 = require('through2')
const stringToStream = require('./stringToStream')
const streamParse = require('./streamParse')
const parse = require('./parse')
const XmlWriter = require('./XmlWriter')

class XmlReader{
    constructor(data, documentTag){
        this.data = data
        this.documentTag = documentTag
    }

    static streamParseFromString(xmlString, splitOn){
        return XmlReader.streamParse(stringToStream(xmlString), splitOn)
    }

    static streamParse(inputStream, splitOn){
        return streamParse(inputStream, splitOn)
            .pipe(through2.obj(function({data, documentTag}, enc, next){
                this.push(new XmlReader(data, documentTag))
                next()
            }))
    }

    static async parse(xmlString){
        return parse(xmlString)
            .then(({data, documentTag}) => {
                return new XmlReader(data, documentTag)
            })
    }

    val(defaultValue){
        return _.get(this.data, 'text', defaultValue)
    }

    valAt(path, defaultValue){
        return this.asObject(path).val(defaultValue)
    }

    attribute(name, defaultValue){
        return _.get(this.data, 'attributes.' + name, defaultValue)
    }

    attributes(){
        return _.get(this.data, 'attributes', {})
    }

    attributeAt(path, name, defaultValue){
        return this.asObject(path).attribute(name, defaultValue)
    }

    has(path){
        return this.asObject(path).data !== undefined
    }

    keys(){
        return Object.keys(this.data.children || {})
    }

    /**
     * Returns the first leaf in the path as an object
     *
     * @param {string} path
     * @returns {XmlReader}
     */
    asObject(path){
        path = path.replace(/\./g, '.0.children.')
        path = `children.${path}.0`
        return new XmlReader(_.get(this.data, path))
    }

    /**
     * Returns the leaf as an array.
     * Will only return the first matching path
     *
     * @param path
     * @returns {XmlReader[]}
     */
    asArray(path){
        path = path.replace(/\./g, '.0.children.')
        path = `children.${path}`
        return _.get(this.data, path, []).map(obj => new XmlReader(obj))
    }

    /**
     * Returns the leaf as an array.
     * Merges the leaf's of all matching paths
     *
     * @param path
     * @returns {XmlReader[]}
     */
    asArrayAll(path){
        if(path.length === 0){
            return []
        }

        let parts = path.split('.')

        let firstPath = parts[0]
        let remainingPath = parts.slice(1).join('.')

        let curr = this.asArray(firstPath)

        if(remainingPath.length === 0){
            return curr
        }

        return curr
            .map(element => element.asArrayAll(remainingPath))
            .reduce((all, curr) => {
                return [...all, ...curr]
            }, [])
    }

    toString(){
        return XmlWriter.fromReader(this).toString()
    }
}

module.exports = XmlReader