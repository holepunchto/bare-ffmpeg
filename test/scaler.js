const test = require('brittle')
const ffmpeg = require('..')

test('it should preseve line number in case of downscale', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })

  using io = new ffmpeg.IOContext(image)
  using format = new ffmpeg.InputFormatContext(io)

  for (const stream of format.streams) {
    using packet = new ffmpeg.Packet()
    format.readFrame(packet)

    using raw = new ffmpeg.Frame()

    using decoder = stream.decoder()
    decoder.open()
    decoder.sendPacket(packet)
    decoder.receiveFrame(raw)

    using rgba = new ffmpeg.Frame()
    rgba.width = decoder.width / 2
    rgba.height = decoder.height / 2
    rgba.format = ffmpeg.constants.pixelFormats.RGBA
    rgba.alloc()

    using scaler = new ffmpeg.Scaler(
      decoder.pixelFormat,
      decoder.width,
      decoder.height,
      rgba.format,
      rgba.width,
      rgba.height
    )
    const lines = scaler.scale(raw, rgba)

    t.ok(lines == rgba.height)
  }
})
