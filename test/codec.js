const test = require('brittle')
const ffmpeg = require('..')

test('codec class should expose a static H264 builder', (t) => {
  const codec = ffmpeg.Codec.H264
  t.ok(codec.encoder)
  t.ok(codec.decoder)
})

test('codec class should expose a static MJPEG builder', (t) => {
  const codec = ffmpeg.Codec.MJPEG
  t.ok(codec.encoder)
  t.ok(codec.decoder)
})

test('codec class should expose a static AAC builder', (t) => {
  const codec = ffmpeg.Codec.AAC
  t.ok(codec.encoder)
  t.ok(codec.decoder)
})
