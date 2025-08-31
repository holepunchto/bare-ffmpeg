const test = require('brittle')
const ffmpeg = require('..')

const { mediaTypes } = ffmpeg.constants

test('IOContext streaming webm with onread', (t) => {
  const data = require('./fixtures/video/sample.webm', {
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

  const { audio, video } = runStreams(io)

  t.is(
    video.length,
    145416,
    `video size mismatch: got ${video.length}, expected 145416`
  )
  t.is(
    audio.length,
    42419,
    `audio size mismatch: got ${audio.length}, expected 42419`
  )
})

test('IOContext streaming mp4 with onseek', (t) => {
  const data = require('./fixtures/video/sample.mp4', {
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
    },

    onseek: (o, whence) => {
      switch (whence) {
        case 'avseek_size':
          return data.length

        case 'seek_set':
          offset = o
          return offset

        default:
          t.fail('seek operation not implemented: ' + whence)
          return -1
      }
    }
  })

  const { audio, video } = runStreams(io)

  t.is(
    video.length,
    140102,
    `video size mismatch: got ${video.length}, expected 140102`
  )
  t.is(
    audio.length,
    34914,
    `audio size mismatch: got ${audio.length}, expected 34914`
  )
})

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
