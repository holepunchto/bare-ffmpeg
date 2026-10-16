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

    t.ok(lines === rgba.height)
  }
})

test('scaler rejects frames that do not match its configuration', (t) => {
  const { YUV420P, RGBA } = ffmpeg.constants.pixelFormats

  using scaler = new ffmpeg.Scaler(YUV420P, 64, 64, RGBA, 32, 32)

  using source = createVideoFrame(YUV420P, 64, 64)
  using larger = createVideoFrame(YUV420P, 128, 128)
  using smaller = createVideoFrame(YUV420P, 32, 32)
  using target = createVideoFrame(RGBA, 32, 32)
  using wrongFormat = createVideoFrame(RGBA, 64, 64)

  t.is(scaler.scale(source, target), 32)

  t.exception(() => scaler.scale(larger, target))
  t.exception(() => scaler.scale(smaller, target))
  t.exception(() => scaler.scale(wrongFormat, target))
  t.exception(() => scaler.scale(source, smaller))
  t.exception(() => scaler.scale(source, 32, 64, target))
  t.exception(() => scaler.scale(source, -1, 64, target))
})

test('scaler throws on unsupported configuration', (t) => {
  const { RGBA } = ffmpeg.constants.pixelFormats

  t.exception(() => new ffmpeg.Scaler(RGBA, 0, 0, RGBA, 32, 32))
})

function createVideoFrame(format, width, height) {
  const frame = new ffmpeg.Frame()
  frame.format = format
  frame.width = width
  frame.height = height
  frame.alloc()
  return frame
}
