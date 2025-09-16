const test = require('brittle')
const ffmpeg = require('..')

test('it should expose a FilterContext class', (t) => {
  const filterCtx = new ffmpeg.FilterContext()
  t.ok(filterCtx)
})
