const test = require('brittle')
const ffmpeg = require('..')

test('codec context could be open without options', (t) => {
  const codec = ffmpeg.Codec.H264
  const codecCtx = new ffmpeg.CodecContext(codec.encoder)
  setDefaultOptions(codecCtx)

  t.execution(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout timebase', (t) => {
  const codec = ffmpeg.Codec.H264
  const codecCtx = new ffmpeg.CodecContext(codec.encoder)
  codecCtx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  codecCtx.width = 100
  codecCtx.height = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout pixelFormat', (t) => {
  const codec = ffmpeg.Codec.H264
  const codecCtx = new ffmpeg.CodecContext(codec.encoder)
  codecCtx.timeBase = new ffmpeg.Rational(1, 30)
  codecCtx.width = 100
  codecCtx.height = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout width', (t) => {
  const codec = ffmpeg.Codec.H264
  const codecCtx = new ffmpeg.CodecContext(codec.encoder)
  codecCtx.timeBase = new ffmpeg.Rational(1, 30)
  codecCtx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  codecCtx.height = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout height', (t) => {
  const codec = ffmpeg.Codec.H264
  const codecCtx = new ffmpeg.CodecContext(codec.encoder)
  codecCtx.timeBase = new ffmpeg.Rational(1, 30)
  codecCtx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  codecCtx.width = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could be open with options', (t) => {
  const codec = ffmpeg.Codec.H264
  const codecCtx = new ffmpeg.CodecContext(codec.encoder)
  setDefaultOptions(codecCtx)

  t.execution(() => {
    codecCtx.open(getEncoderOptions())
  })
})

function setDefaultOptions(ctx) {
  ctx.timeBase = new ffmpeg.Rational(1, 30)
  ctx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  ctx.width = 100
  ctx.height = 100
}

function getEncoderOptions() {
  const encoderOptions = new ffmpeg.Dictionary()
  encoderOptions.set('preset', 'ultrafast')
  encoderOptions.set('tune', 'zerolatency')
  return encoderOptions
}
