const test = require('brittle')
const ffmpeg = require('..')

test('decoder can be instanciate by name', (t) => {
  const codec = new ffmpeg.Codec('mpeg4')
 
  t.ok(codec.decoder)
})

test('decoder can be instanciate by id', (t) => {
  const codec = new ffmpeg.Codec(1)
 
  t.ok(codec.decoder)
})

