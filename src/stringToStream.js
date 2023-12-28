const ReadableStream = require('stream').Readable

function stringToStream(str) {
    const stream = new ReadableStream()
    stream._read = () => {}

    // setImmediate allows piping stream before we start filling it
    setImmediate(() => {
        stream.push(str)
        stream.push(null)
    })

    return stream
}

module.exports = stringToStream
