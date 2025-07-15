const test = require('brittle')
const ffmpeg = require('..')

test('it should preseve line number in case of downscale', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })

  const io = new ffmpeg.IOContext(image)
  using format = new ffmpeg.InputFormatContext(io)

  for (const stream of format.streams) {
    using packet = new ffmpeg.Packet()
    format.readFrame(packet)

    using raw = new ffmpeg.Frame()
    using rgba = new ffmpeg.Frame()

    using decoder = stream.decoder()
    decoder.sendPacket(packet)
    decoder.receiveFrame(raw)

    const targetWidth = decoder.width / 2
    const targetHeight = decoder.height / 2

    rgba.width = targetWidth
    rgba.height = targetHeight
    rgba.pixelFormat = ffmpeg.constants.pixelFormats.RGBA
    rgba.alloc()

    using scaler = new ffmpeg.Scaler(
      decoder.pixelFormat,
      decoder.width,
      decoder.height,
      rgba.pixelFormat,
      rgba.width,
      rgba.height
    )
    const lines = scaler.scale(raw, rgba)

    t.ok(lines == targetHeight)
  }
})

