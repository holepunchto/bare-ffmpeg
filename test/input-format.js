const test = require('brittle')
const ffmpeg = require('..')

test('input format should instantiate', (t) => {
  let inputFormat

  if (Bare.platform == 'darwin') {
    inputFormat = new ffmpeg.InputFormat('avfoundation')
  } else if (Bare.platform == 'linux') {
    inputFormat = new ffmpeg.InputFormat('v4l2')
  } else {
    inputFormat = new ffmpeg.InputFormat('dshow')
  }

  t.ok(inputFormat)
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
