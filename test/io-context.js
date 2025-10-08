const test = require('brittle')
const ffmpeg = require('..')

const { mediaTypes } = ffmpeg.constants

test('IOContext should propagate onread throwed error properly', (t) => {
  const readError = 'read error'
  const io = new ffmpeg.IOContext(4096, {
    onread: () => {
      throw new Error(readError)
    }
  })

  t.plan(1)
  try {
    using _ctx = new ffmpeg.InputFormatContext(io)
  } catch (err) {
    t.is(err.message, readError)
  }
})

test('IOContext should propagate onseek throwed error properly', (t) => {
  const data = require('./fixtures/video/sample.webm', {
    with: { type: 'binary' }
  })
  const seekError = 'seek error'

  let offset = 0
  const io = new ffmpeg.IOContext(4096, {
    onread: (buffer) => {
      const remaining = data.length - offset
      if (remaining <= 0) return 0
      const n = Math.min(buffer.length, remaining)
      buffer.set(data.subarray(offset, offset + n))
      offset += n
      return n
    },
    onseek: () => {
      if (offset > 4096) throw new Error(seekError)
      return data.length
    }
  })

  t.plan(1)
  try {
    using _ctx = new ffmpeg.InputFormatContext(io)
  } catch (err) {
    t.is(err.message, seekError)
  }
})

test('IOContext should propagate onwrite throwed error properly', (t) => {
  const writeError = 'write error'
  const io = new ffmpeg.IOContext(4096, {
    onwrite: () => {
      throw new Error(writeError)
    }
  })
  const outFormat = new ffmpeg.OutputFormat('webm')
  using outContext = new ffmpeg.OutputFormatContext(outFormat, io)

  const outputStream = outContext.createStream()
  outputStream.codec = ffmpeg.Codec.AV1
  outputStream.codecParameters.type = mediaTypes.VIDEO
  outputStream.codecParameters.id = ffmpeg.Codec.AV1.id
  outputStream.codecParameters.width = 1
  outputStream.codecParameters.height = 1

  t.plan(1)
  try {
    outContext.writeHeader()
  } catch (err) {
    t.is(err.message, writeError)
  }
})

test('IOContext streaming webm with onread', (t) => {
  const data = require('./fixtures/video/sample.webm', {
    with: { type: 'binary' }
  })

  let offset = 0
  const io = new ffmpeg.IOContext(4096, {
    onread: (buffer) => {
      if (!offset) {
        t.ok(Buffer.isBuffer(buffer), 'is buffer')
      }

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

  const { audio, video } = runStreams(io)

  t.is(video.length, 145416, `video size: got ${video.length}, expected 145416`)
  t.is(audio.length, 42419, `audio size: got ${audio.length}, expected 42419`)
})

test('IOContext streaming mp4 with onseek', (t) => {
  const data = require('./fixtures/video/sample.mp4', {
    with: { type: 'binary' }
  })

  let offset = 0
  const io = new ffmpeg.IOContext(4096, {
    onread: (buffer) => {
      if (!offset) {
        t.ok(Buffer.isBuffer(buffer), 'is buffer')
      }

      const bytesToRead = Math.min(buffer.length, data.length - offset)

      if (bytesToRead === 0) {
        return 0
      }

      const chunk = data.subarray(offset, offset + bytesToRead)

      buffer.set(chunk)
      offset += bytesToRead
      return bytesToRead
    },

    onseek: (o, whence) => {
      switch (whence) {
        case ffmpeg.constants.seek.SIZE:
          return data.length

        case ffmpeg.constants.seek.SET:
          offset = o
          return offset

        default:
          t.fail('seek operation not implemented: ' + whence)
          return -1
      }
    }
  })

  const { audio, video } = runStreams(io)

  t.is(video.length, 140102, `video size: got ${video.length}, expected 140102`)
  t.is(audio.length, 34914, `audio size: got ${audio.length}, expected 34914`)
})

// Helpers

function runStreams(io) {
  using format = new ffmpeg.InputFormatContext(io)
  using packet = new ffmpeg.Packet()

  const streams = []
  for (const stream of format.streams) {
    streams[stream.index] = { stream, decoder: stream.decoder() }
  }

  let video = []
  let audio = []

  while (format.readFrame(packet)) {
    const { stream, decoder } = streams[packet.streamIndex]
    const mediaType = stream.codecParameters.type

    decoder.open()
    decoder.sendPacket(packet)

    while (decoder.receiveFrame(new ffmpeg.Frame())) {}

    if (mediaType === mediaTypes.VIDEO) {
      video.push(packet.data)
    } else if (mediaType === mediaTypes.AUDIO) {
      audio.push(packet.data)
    }

    packet.unref()
  }

  for (const { decoder } of streams) {
    decoder.destroy()
  }

  video = Buffer.concat(video)
  audio = Buffer.concat(audio)

  return { video, audio }
}
