const test = require('brittle')
const ffmpeg = require('..')

test('encoder can be instanciate by name', (t) => {
  const codec = new ffmpeg.Codec('h264')
  codec.encoder
  t.ok(codec)
})
