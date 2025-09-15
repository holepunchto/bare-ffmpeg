const test = require('brittle')
const ffmpeg = require('..')

test('it should expose a filter class', (t) => {
  const filter = new ffmpeg.Filter('buffer')
  t.ok(filter)
})
