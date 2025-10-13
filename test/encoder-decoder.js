const test = require('brittle')
const ffmpeg = require('..')

// Encoder

test('Encoder.getHardwareConfigAt should return null when config is not available', (t) => {
  const { encoder } = ffmpeg.Codec.AV1

  t.is(encoder.getHardwareConfigAt(0), null)
})

test.skip('Encoder should expose getHardwareConfigAt method', (t) => {
  const { encoder } = ffmpeg.Codec.AV1

  t.ok(encoder.getHardwareConfigAt(0) instanceof ffmpeg.CodecHWConfig)
})

// Decoder

test('Decoder.getHardwareConfigAt should return null when config is not available', (t) => {
  const { decoder } = ffmpeg.Codec.AV1

  t.is(decoder.getHardwareConfigAt(0), null)
})

test.skip('Decoder should expose getHardwareConfigAt method', (t) => {
  const { decoder } = ffmpeg.Codec.AV1

  t.ok(decoder.getHardwareConfigAt(0) instanceof ffmpeg.CodecHWConfig)
})
