const test = require('brittle')
const ffmpeg = require('..')

// Encoder

test('Encoder.getHardwareConfigAt should return null when config is not available', (t) => {
  const { encoder } = ffmpeg.Codec.MJPEG

  t.is(encoder.getHardwareConfigAt(0), null)
})

test.skip('Encoder should expose getHardwareConfigAt method', (t) => {
  const { encoder } = ffmpeg.Codec.MJPEG

  t.ok(encoder.getHardwareConfigAt(1) instanceof ffmpeg.CodecHWConfig)
})

// Decoder

test('Decoder.getHardwareConfigAt should return null when config is not available', (t) => {
  const { decoder } = ffmpeg.Codec.MJPEG

  t.is(decoder.getHardwareConfigAt(0), null)
})

test.skip('Decoder should expose getHardwareConfigAt method', (t) => {
  const { decoder } = ffmpeg.Codec.MJPEG

  t.ok(decoder.getHardwareConfigAt(1) instanceof ffmpeg.CodecHWConfig)
})
