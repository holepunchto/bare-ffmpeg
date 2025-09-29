const test = require('brittle')
const ffmpeg = require('..')

test('input format should instantiate', (t) => {
  t.ok(new ffmpeg.InputFormat())
})

test('InputFormat should expose an extensions getter', (t) => {
  const inputFormat = new ffmpeg.InputFormat('webm')
  t.is(inputFormat.extensions, 'mkv,mk3d,mka,mks,webm')
})

test('InputFormat should expose an mimeType getter', (t) => {
  const inputFormat = new ffmpeg.InputFormat('webm')
  t.is(
    inputFormat.mimeType,
    'audio/webm,audio/x-matroska,video/webm,video/x-matroska'
  )
})

test('InputFormat should expose a static method to create from handle', (t) => {
  const handle = new ArrayBuffer(8)

  const inputFormat = ffmpeg.InputFormat.from(handle)

  t.ok(inputFormat)
})
