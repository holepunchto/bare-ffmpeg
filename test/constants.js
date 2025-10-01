const test = require('brittle')
const ffmpeg = require('..')

test('constants should expose a getSampleFormatName function', (t) => {
  t.is(
    ffmpeg.constants.getSampleFormatName(ffmpeg.constants.sampleFormats.S16),
    's16'
  )
})

test('constants should expose a getPixelFormatName function', (t) => {
  t.is(
    ffmpeg.constants.getPixelFormatName(ffmpeg.constants.pixelFormats.RGB24),
    'rgb24'
  )
})
