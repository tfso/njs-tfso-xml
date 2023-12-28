const parseString = require('xml2js').parseString
const toPromise = require('./toPromise')

function visitNodes(node, visit) {
    if (!node) return

    visit(node)

    Object.keys(node.children || {}).forEach((key) => {
        node.children[key].forEach((childNode) => visitNodes(childNode, visit))
    })
}

async function parse(xmlString) {
    const root = await toPromise(
        parseString.bind(null, xmlString, {
            explicitRoot: true, // Otherwise we won't get the root object
            explicitCharkey: true, // Otherwise charkey is not always used
            explicitChildren: true, // To get the children object, and never risk naming collisions
            childkey: 'children', // Nicer name
            attrkey: 'attributes', // Nicer name
            charkey: 'text', // Nicer name
            trim: true, // Text node whitespace is trimmed
            emptyTag: {}, // The default is empty string, which doesn't play nice with the explicitCharkey option
        })
    )

    const documentTag = Object.keys(root)[0]
    const data = root[documentTag]

    visitNodes(data, (node) => {
        if (node.text === '') {
            delete node.text // Some cdata is kept as empty string, which doesn't work when doing idempotent write+read
        }
    })

    return { data, documentTag }
}

module.exports = parse
