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

  t.ok(fr.width == 200)
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

  t.ok(fr.height == 200)
})

test('frame expose a setter for pixelFormat', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.pixelFormat = ffmpeg.constants.YUV420P
  })
})

test('frame expose a getter for pixelFormat', (t) => {
  const fr = new ffmpeg.Frame()
  fr.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P

  t.ok(fr.pixelFormat == ffmpeg.constants.pixelFormats.YUV420P)
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
