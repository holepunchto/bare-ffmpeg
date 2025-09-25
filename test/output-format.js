const test = require('brittle')
const ffmpeg = require('..')

test('it should expose an OutputFormat class', (t) => {
  t.ok(new ffmpeg.OutputFormat('webm'))
})
