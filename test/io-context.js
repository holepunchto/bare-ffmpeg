const test = require('brittle')
const ffmpeg = require('..')

const { mediaTypes } = ffmpeg.constants

test('IOContext streaming webm with onread', (t) => {
  const data = require('./fixtures/video/sample.webm', {
    with: { type: 'binary' }
  })

  let offset = 0
  const io = new ffmpeg.IOContext(4096, {
    onread: (len) => {
      if (offset >= data.length) {
        return Buffer.alloc(0)
      }

      const n = Math.min(len, data.length - offset)
      const chunk = data.subarray(offset, offset + n)
      offset += n

      return chunk
    }
  })

  const { audio, video } = runStreams(io)

  t.is(video.length, 145416, 'video size matches')
  t.is(audio.length, 42419, 'audio size matches')
})

test('IOContext streaming mp4 with onseek', (t) => {
  const data = require('./fixtures/video/sample.mp4', {
    with: { type: 'binary' }
  })

  let offset = 0
  const io = new ffmpeg.IOContext(4096, {
    onread: (len) => {
      if (offset >= data.length) {
        return Buffer.alloc(0)
      }

      const n = Math.min(len, data.length - offset)
      const chunk = data.subarray(offset, offset + n)
      offset += n

      return chunk
    },
    onseek: (newOffset) => {
      offset = Math.max(0, Math.min(newOffset, data.length))
    }
  })

  const { audio, video } = runStreams(io)

  t.is(video.length, 140102, 'video size matches')
  t.is(audio.length, 34914, 'audio size matches')
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
