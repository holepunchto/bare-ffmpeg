const test = require('brittle')
const ffmpeg = require('.')

test('decode .heic', (t) => {
  const image = require('./test/fixtures/image/sample.heic', {
    with: { type: 'binary' }
  })

  const io = new ffmpeg.IOContext(image)
  const format = new ffmpeg.FormatContext(io)

  for (const stream of format.streams) {
    const packet = new ffmpeg.Packet()
    format.readFrame(packet)

    const raw = new ffmpeg.Frame()
    const rgba = new ffmpeg.Frame()

    const decoder = stream.decoder()
    decoder.sendPacket(packet)
    decoder.receiveFrame(raw)

    const image = new ffmpeg.Image('RGBA', decoder.width, decoder.height)
    image.fill(rgba)

    const scaler = new ffmpeg.Scaler(
      decoder.pixelFormat,
      decoder.width,
      decoder.height,
      image.pixelFormat,
      image.width,
      image.height
    )

    scaler.scale(raw, rgba)
    scaler.destroy()

    packet.destroy()
    raw.destroy()
    rgba.destroy()
    decoder.destroy()

    t.comment('width', image.width)
    t.comment('height', image.height)
    t.comment('data', image.data)
  }

  format.destroy()
  io.destroy()
})

test('decode .aiff', (t) => {
  const audio = require('./test/fixtures/audio/sample.aiff', {
    with: { type: 'binary' }
  })

  const io = new ffmpeg.IOContext(audio)
  const format = new ffmpeg.FormatContext(io)

  for (const stream of format.streams) {
    const packet = new ffmpeg.Packet()
    const frame = new ffmpeg.Frame()

    const decoder = stream.decoder()

    const buffers = []

    while (format.readFrame(packet)) {
      decoder.sendPacket(packet)

      while (decoder.receiveFrame(frame)) {
        buffers.push(frame.channel(0))
      }
    }

    packet.destroy()
    frame.destroy()
    decoder.destroy()

    t.comment('hz', stream.codecParameters.sampleRate)
    t.comment('bits', stream.codecParameters.bitsPerCodedSample)
    t.comment('data', Buffer.concat(buffers))
  }

  format.destroy()
  io.destroy()
})
