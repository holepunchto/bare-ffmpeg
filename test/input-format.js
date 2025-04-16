const test = require('brittle')
const ffmpeg = require('..')

test('input format should wrap an array buffer', (t) => {
  const inputFormat = new ffmpeg.InputFormat('avfoundation')

  t.ok(inputFormat._handle instanceof ArrayBuffer)
})

test('input format should throw if the name is wrong', (t) => {
  t.exception(() => {
    const inputFormat = new ffmpeg.InputFormat('foobar')
  }, `No input format found for name foobar`)
})
