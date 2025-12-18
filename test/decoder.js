const test = require('brittle')
const ffmpeg = require('..')

test('Decoder.byName() for vp8', (t) => {
  const decoder = ffmpeg.Decoder.byName('vp8')
  t.ok(decoder, 'vp8 decoder found')
  t.ok(decoder._handle, 'decoder has handle')
  t.is(decoder._codec.name, 'vp8', 'codec name is vp8')
})

test('Decoder.byName() for vp9', (t) => {
  const decoder = ffmpeg.Decoder.byName('vp9')
  t.ok(decoder, 'vp9 decoder found')
  t.ok(decoder._handle, 'decoder has handle')
  t.is(decoder._codec.name, 'vp9', 'codec name is vp9')
})

test('Decoder.byName() for h264', (t) => {
  const decoder = ffmpeg.Decoder.byName('h264')
  t.ok(decoder, 'h264 decoder found')
  t.ok(decoder._handle, 'decoder has handle')
  t.is(decoder._codec.name, 'h264', 'codec name is h264')
})

test('Decoder.byName() for libdav1d (AV1)', (t) => {
  const decoder = ffmpeg.Decoder.byName('libdav1d')
  t.ok(decoder, 'libdav1d decoder found')
  t.ok(decoder._handle, 'decoder has handle')
  t.is(decoder._codec.name, 'libdav1d', 'codec name is libdav1d')
})

test('Decoder.byName() throws for non-existent decoder', (t) => {
  t.exception(() => {
    ffmpeg.Decoder.byName('non_existent_decoder')
  })
})
