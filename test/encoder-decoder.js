const test = require('brittle')
const ffmpeg = require('..')

test('Encoder should expose hardwareConfig getter', (t) => {
  const { encoder } = ffmpeg.Codec.MJPEG

  t.ok(encoder.getHardwareConfigAt(1) instanceof ffmpeg.CodecHWConfig)
})

test('Decoder should expose hardwareConfig getter', (t) => {
  const { decoder } = ffmpeg.Codec.MJPEG

  t.ok(decoder.getHardwareConfigAt(1) instanceof ffmpeg.CodecHWConfig)
})
