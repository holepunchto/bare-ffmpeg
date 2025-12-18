const test = require('brittle')
const ffmpeg = require('..')

test('Decoder with string name for vp8', (t) => {
  const decoder = new ffmpeg.Decoder('vp8')
  t.ok(decoder, 'vp8 decoder found')
})

test('Decoder with VP8 Codec', (t) => {
  const decoder = new ffmpeg.Decoder(ffmpeg.Codec.VP8)
  t.ok(decoder, 'vp8 decoder found')
})

test('Decoder with string name for vp9', (t) => {
  const decoder = new ffmpeg.Decoder('vp9')
  t.ok(decoder, 'vp9 decoder found')
})

test('Decoder with VP9 Codec', (t) => {
  const decoder = new ffmpeg.Decoder(ffmpeg.Codec.VP9)
  t.ok(decoder, 'vp9 decoder found')
})

test('Decoder with string name for h264', (t) => {
  const decoder = new ffmpeg.Decoder('h264')
  t.ok(decoder, 'h264 decoder found')
})

test('Decoder with H264 Codec', (t) => {
  const decoder = new ffmpeg.Decoder(ffmpeg.Codec.H264)
  t.ok(decoder, 'h264 decoder found')
})

test('Decoder with string name for libdav1d (AV1)', (t) => {
  const decoder = new ffmpeg.Decoder('libdav1d')
  t.ok(decoder, 'libdav1d decoder found')
})

test('Decoder with AV1 Codec', (t) => {
  const decoder = new ffmpeg.Decoder(ffmpeg.Codec.AV1)
  t.ok(decoder, 'av1 decoder found')
})

test('Decoder throws for non-existent decoder', (t) => {
  t.exception(() => {
    new ffmpeg.Decoder('non_existent_decoder')
  })
})
