const test = require('brittle')
const ffmpeg = require('..')

test('frame expose a setter for width', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.width = 200
  })
})

test('frame expose a getter for width', (t) => {
  const fr = new ffmpeg.Frame()
  fr.width = 200

  t.ok(fr.width === 200)
})

test('frame expose a setter for height', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.height = 200
  })
})

test('frame expose a getter for height', (t) => {
  const fr = new ffmpeg.Frame()
  fr.height = 200

  t.ok(fr.height === 200)
})

test('frame expose a setter for format', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.format = ffmpeg.constants.pixelFormats.YUV420P
  })
})

test('frame expose a getter for format', (t) => {
  const fr = new ffmpeg.Frame()
  fr.format = ffmpeg.constants.pixelFormats.YUV420P

  t.ok(fr.format === ffmpeg.constants.pixelFormats.YUV420P)
})

test('frame expose an alloc method', (t) => {
  const fr = new ffmpeg.Frame()

  fr.height = 200
  fr.width = 200
  fr.format = ffmpeg.constants.pixelFormats.YUV420P
  t.execution(() => {
    fr.alloc()
  })
})

test('frame expose a setter for nbSamples', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.nbSamples = 1024
  })
})

test('frame expose a accessor for pts', (t) => {
  const fr = new ffmpeg.Frame()

  t.is(fr.pts, -1)

  fr.pts = 0

  t.is(fr.pts, 0)
})

test('frame expose a accessor for pkt_dts', (t) => {
  const fr = new ffmpeg.Frame()

  t.is(fr.packetDTS, -1)

  fr.packetDTS = 0

  t.is(fr.packetDTS, 0)
})

test('frame expose a accessor for timeBase', (t) => {
  const fr = new ffmpeg.Frame()

  t.alike(fr.timeBase, new ffmpeg.Rational(0, 1))

  const base = new ffmpeg.Rational(1, 1000)
  fr.timeBase = base

  t.alike(fr.timeBase, base)
})

test('frame expose getter for picture type', (t) => {
  const fr = new ffmpeg.Frame()
  t.is(fr.pictType, ffmpeg.constants.pictureTypes.NONE)
})

test('frame expose a setter for sampleRate', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.sampleRate = 48000
  })
})

test('frame expose a getter for sampleRate', (t) => {
  const fr = new ffmpeg.Frame()
  fr.sampleRate = 48000

  t.ok(fr.sampleRate === 48000)
})

test('copy frame properties', (t) => {
  const a = new ffmpeg.Frame()
  a.pts = 12

  const b = new ffmpeg.Frame()
  t.not(b.pts, 12)

  b.copyProperties(a)

  t.is(b.pts, 12)
})

test('frame expose a transferTo method', (t) => {
  const src = new ffmpeg.Frame()
  const dst = new ffmpeg.Frame()

  t.ok(typeof src.transferTo === 'function')
})
