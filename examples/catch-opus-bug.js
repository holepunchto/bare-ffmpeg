const ffmpeg = require('..')
const assert = require('bare-assert')

const data = require('./fixtures/avsynctest.webm', {
  with: { type: 'binary' }
})

let offset = 0
const io = new ffmpeg.IOContext(4096, {
  onread: (buffer) => {
    const bytesToRead = Math.min(buffer.length, data.length - offset)

    if (bytesToRead === 0) {
      return 0
    }

    const chunk = data.subarray(offset, offset + bytesToRead)

    buffer.set(chunk)
    offset += bytesToRead
    return bytesToRead
  }
})

const format = new ffmpeg.InputFormatContext(io)
const audioInputStream = format.streams.find(
  (stream) => stream.codecParameters.type === ffmpeg.constants.mediaTypes.AUDIO
)
console.log(audioInputStream.codec)

const outputFormat = new ffmpeg.OutputFormat('webm')
const outputFormatContext = new ffmpeg.OutputFormatContext(outputFormat, new ffmpeg.IOContext(4096))
console.log('outputFormat set')

const outputStream = outputFormatContext.createStream()
outputStream.codecParameters = audioInputStream.codecParameters
outputStream.timeBase = audioInputStream.timeBase

outputFormatContext.writeHeader()

const packet = new ffmpeg.Packet()
while (format.readFrame(packet)) {
  if (packet.streamIndex !== audioInputStream.index) {
    packet.unref()
    continue
  }

  packet.streamIndex = outputStream.index

  outputFormatContext.writeFrame(packet)
  packet.unref()
}

outputFormatContext.writeTrailer()
