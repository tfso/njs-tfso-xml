const ReadableStream = require('stream').Readable
const sax = require('sax')
const _ = require('lodash')

function convertNodeToXml2JsFormat(node){
    let newNode = {}

    let children = {}
    _(node.children)
        .groupBy('name')
        .forEach((nodes, key) => {
            children[key] = nodes.map(value => convertNodeToXml2JsFormat(value))
        })

    if(node.text){
        newNode.text = node.text
    }
    if(Object.keys(node.attributes).length > 0){
        newNode.attributes = node.attributes
    }
    if(Object.keys(children).length > 0){
        newNode.children = children
    }

    return newNode
}

function createOutputStream(){
    const stream = new ReadableStream({objectMode: true})
    stream._read = () => {}
    let ended = false

    // Some utility methods below

    stream.send = data => {
        if(!ended){
            stream.push(data)
        }
    }

    stream.errorAndCancel = err => {
        if(!ended){
            stream.emit('error', err)
            stream.push(null)
            ended = true
        }
    }

    stream.end = () => {
        if(!ended){
            stream.push(null)
            ended = true
        }
    }

    return stream
}

function streamParse(inputStream, splitOn = ''){
    const parser = sax.createStream(true)
    const output = createOutputStream()

    let stack = [{
        name: 'base',
        attributes: {},
        text: '',
        children: [],
        parent: null
    }]

    parser.onopentag = (node) => {
        let parent = stack[stack.length - 1]
        node = {
            name: node.name,
            attributes: node.attributes,
            text: '',
            cdata: false,
            children: [],
            parent
        }
        parent.children.push(node)

        stack.push(node)
    }
    parser.ontext = text => {
        if(stack.length > 0){
            stack[stack.length - 1].text += text
        }
    }
    parser.oncdata = text => {
        if(stack.length > 0){
            stack[stack.length - 1].text += text
            stack[stack.length - 1].cdata = true
        }
    }
    parser.onclosetag = (name) => {
        let location = stack.slice(2).map(n => n.name).join('.') // NB: Doesn't include the base node OR document tag
        let node = stack.pop()

        node.text = node.text.trim()

        if(location === splitOn){
            let baseNode = node
            while(baseNode.parent !== null){
                baseNode = baseNode.parent
            }
            let documentTag = baseNode.children[0].name
            let root = convertNodeToXml2JsFormat(baseNode)
            let data = root.children[documentTag][0]

            output.send({data, documentTag})
            node.parent.children = node.parent.children.filter(child => child.name !== name) // This is the magic trick that saves memory. Removes all nodes with the tag to split on.
        }
    }
    parser.on('error', err => {
        output.errorAndCancel(err)
    })
    parser.on('end', () => {
        output.end()
    })

    inputStream.pipe(parser)

    return output
}

module.exports = streamParse