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

test('input format should throw if the name is empty', (t) => {
  t.exception.all(() => {
    const inputFormat = new ffmpeg.InputFormat('')
  }, `Input format name should be a non empty string`)
})

test('input format should throw if the name is not a string', (t) => {
  t.exception.all(() => {
    const inputFormat = new ffmpeg.InputFormat(0)
  }, `Input format name should be a non empty string`)
})
