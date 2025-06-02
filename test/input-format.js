const test = require('brittle')
const ffmpeg = require('..')

test('input format should instantiate', (t) => {
  t.ok(new ffmpeg.InputFormat())
})
