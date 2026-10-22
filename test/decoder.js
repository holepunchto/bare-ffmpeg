const test = require('brittle')
const ffmpeg = require('..')
const { isApple, isIOS } = require('./helpers')

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

test('Decoder with string name for aac_at', { skip: !isApple }, (t) => {
  const decoder = new ffmpeg.Decoder('aac_at')
  t.ok(decoder, 'aac_at decoder found')
})

test('Decoder gsm_ms_at and ilbc_at are macOS only', { skip: !isApple }, (t) => {
  for (const name of ['gsm_ms_at', 'ilbc_at']) {
    if (isIOS) {
      t.exception(() => new ffmpeg.Decoder(name), `${name} absent on iOS`)
    } else {
      t.ok(new ffmpeg.Decoder(name), `${name} found on macOS`)
    }
  }
})
