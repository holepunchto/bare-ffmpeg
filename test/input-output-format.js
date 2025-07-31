const test = require('brittle')
const ffmpeg = require('..')

test('input format should instantiate', (t) => {
  const input = new ffmpeg.InputFormat()
  t.ok(input)
})

test('InputFormat info', (t) => {
  const input = new ffmpeg.InputFormat('aiff')

  t.is(input.name, 'aiff')
  t.is(input.longName, 'Audio IFF')
})

test('OutputFormat info', (t) => {
  const output = new ffmpeg.OutputFormat('webm')

  t.is(output.name, 'webm')
  t.is(output.longName, 'WebM')
})
