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

test('frame expose a setter for pixelFormat', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  })
})

test('frame expose a getter for pixelFormat', (t) => {
  const fr = new ffmpeg.Frame()
  fr.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P

  t.ok(fr.pixelFormat === ffmpeg.constants.pixelFormats.YUV420P)
})

test('frame expose an alloc method', (t) => {
  const fr = new ffmpeg.Frame()

  fr.height = 200
  fr.width = 200
  fr.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
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
