const test = require('brittle')
const ffmpeg = require('..')

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

test('codec class should expose a static OPUS builder', (t) => {
  const codec = ffmpeg.Codec.OPUS
  t.ok(codec.encoder)
  t.ok(codec.decoder)
})

test('codec class should expose a static AV1 builder', (t) => {
  const codec = ffmpeg.Codec.AV1
  t.ok(codec.encoder)
  t.ok(codec.decoder)
})

test('codec inspect does not throw if id is unset', (t) => {
  const codec = new ffmpeg.Codec()
  t.execution(() => {
    codec[Symbol.for('bare.inspect')]()
  })
})
