const test = require('brittle')
const ffmpeg = require('..')

test('constants should expose a getSampleFormatName function', (t) => {
  t.is(ffmpeg.constants.getSampleFormatName(ffmpeg.constants.sampleFormats.S16), 's16')
})

test('constants should expose a getPixelFormatName function', (t) => {
  t.is(ffmpeg.constants.getPixelFormatName(ffmpeg.constants.pixelFormats.RGB24), 'rgb24')
})

test('toPixelFormat should convert string to pixel format constant', (t) => {
  t.is(ffmpeg.constants.toPixelFormat('RGB24'), ffmpeg.constants.pixelFormats.RGB24)
})

test('toPixelFormat should pass through number values', (t) => {
  const format = ffmpeg.constants.pixelFormats.YUV420P
  t.is(ffmpeg.constants.toPixelFormat(format), format)
})

test('toPixelFormat should throw for unknown format', (t) => {
  t.exception(() => {
    ffmpeg.constants.toPixelFormat('UNKNOWN_FORMAT')
  })
})

test('toPixelFormat should throw for invalid type', (t) => {
  t.exception.all(() => {
    ffmpeg.constants.toPixelFormat({})
  })
})

test('toSampleFormat should convert string to sample format constant', (t) => {
  t.is(ffmpeg.constants.toSampleFormat('S16'), ffmpeg.constants.sampleFormats.S16)
})

test('toSampleFormat should pass through number values', (t) => {
  const format = ffmpeg.constants.sampleFormats.FLTP
  t.is(ffmpeg.constants.toSampleFormat(format), format)
})

test('toSampleFormat should throw for unknown format', (t) => {
  t.exception(() => {
    ffmpeg.constants.toSampleFormat('UNKNOWN_FORMAT')
  })
})

test('toSampleFormat should throw for invalid type', (t) => {
  t.exception.all(() => {
    ffmpeg.constants.toSampleFormat([])
  })
})

test('toChannelLayout should convert string to channel layout constant', (t) => {
  t.is(ffmpeg.constants.toChannelLayout('STEREO'), ffmpeg.constants.channelLayouts.STEREO)
})

test('toChannelLayout should handle numeric string keys', (t) => {
  t.is(ffmpeg.constants.toChannelLayout('5.1'), ffmpeg.constants.channelLayouts['5.1'])
})

test('toChannelLayout should pass through number values', (t) => {
  const layout = ffmpeg.constants.channelLayouts.MONO
  t.is(ffmpeg.constants.toChannelLayout(layout), layout)
})

test('toChannelLayout should throw for unknown layout', (t) => {
  t.exception(() => {
    ffmpeg.constants.toChannelLayout('UNKNOWN_LAYOUT')
  })
})

test('toChannelLayout should throw for not valid type', (t) => {
  t.exception.all(() => {
    ffmpeg.constants.toChannelLayout(null)
  })
})
