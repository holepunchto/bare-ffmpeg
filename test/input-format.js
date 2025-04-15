const test = require('brittle')
const ffmpeg = require('..')

test('input format should wrap an array buffer', (t) => {
  const inputFormat = new ffmpeg.InputFormat('avfoundation')

  t.ok(inputFormat._handle instanceof ArrayBuffer)
})
