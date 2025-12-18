const test = require('brittle')
const ffmpeg = require('..')

test('Encoder with string name for libvpx (VP8)', (t) => {
  const encoder = new ffmpeg.Encoder('libvpx')
  t.ok(encoder, 'libvpx encoder found')
})

test('Encoder with string name for libvpx-vp9 (VP9)', (t) => {
  const encoder = new ffmpeg.Encoder('libvpx-vp9')
  t.ok(encoder, 'libvpx-vp9 encoder found')
})

test('Encoder with string name for libsvtav1 (AV1)', (t) => {
  const encoder = new ffmpeg.Encoder('libsvtav1')
  t.ok(encoder, 'libsvtav1 encoder found')
})

test('Encoder with string name for libopus (OPUS)', (t) => {
  const encoder = new ffmpeg.Encoder('libopus')
  t.ok(encoder, 'libopus encoder found')
})

test('Encoder throws for non-existent encoder', (t) => {
  t.exception(() => {
    new ffmpeg.Encoder('non_existent_encoder')
  })
})
