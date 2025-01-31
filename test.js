const test = require('brittle')
const ffmpeg = require('.')

test('decode .heic', (t) => {
  const image = require('./test/fixtures/grapefruit.heic', {
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

    packet.destroy()

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

    raw.destroy()
    rgba.destroy()

    t.comment(image)
  }

  format.destroy()
  io.destroy()
})
