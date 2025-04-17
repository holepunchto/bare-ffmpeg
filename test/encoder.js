const test = require('brittle')
const ffmpeg = require('..')

test('encoder can be instanciate by name', (t) => {
  const codec = new ffmpeg.Codec('libx264')
  const enc = new ffmpeg.Encoder(codec)
  t.ok(enc)
})

test('encoder can be instanciate by id', (t) => {
  const codec = new ffmpeg.Codec(1)
  const enc = new ffmpeg.Encoder(codec)
  t.ok(enc)
})
