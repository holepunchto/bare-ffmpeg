const test = require('brittle')
const ffmpeg = require('..')

test('Encoder.byName() for libvpx (VP8)', (t) => {
  const encoder = ffmpeg.Encoder.byName('libvpx')
  t.ok(encoder, 'libvpx encoder found')
})

test('Encoder.byName() for libvpx-vp9 (VP9)', (t) => {
  const encoder = ffmpeg.Encoder.byName('libvpx-vp9')
  t.ok(encoder, 'libvpx-vp9 encoder found')
})

test('Encoder.byName() for libsvtav1 (AV1)', (t) => {
  const encoder = ffmpeg.Encoder.byName('libsvtav1')
  t.ok(encoder, 'libsvtav1 encoder found')
})

test('Encoder.byName() for libopus (OPUS)', (t) => {
  const encoder = ffmpeg.Encoder.byName('libopus')
  t.ok(encoder, 'libopus encoder found')
})

test('Encoder.byName() throws for non-existent encoder', (t) => {
  t.exception(() => {
    ffmpeg.Encoder.byName('non_existent_encoder')
  })
})
