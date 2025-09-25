const test = require('brittle')
const ffmpeg = require('..')

test('it should expose an OutputFormat class', (t) => {
  t.ok(new ffmpeg.OutputFormat('webm'))
})

test('OutputFormat should expose an extensions getter', (t) => {
  const outputFormat = new ffmpeg.OutputFormat('webm')
  t.is(outputFormat.extensions, 'webm')
})

test('OutputFormat should expose an mimeType getter', (t) => {
  const outputFormat = new ffmpeg.OutputFormat('webm')
  t.is(outputFormat.mimeType, 'video/webm')
})
