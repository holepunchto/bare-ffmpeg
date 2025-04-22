const test = require('brittle')
const ffmpeg = require('..')

test('codec context could be open without options', (t) => {
  const codec = new ffmpeg.Codec('h264')
  const codecCtx = new ffmpeg.CodecContext(codec.encoder)
  setDefaultOptions(codecCtx)

  t.execution(() => {
    codecCtx.open()
  })
})

test('codec context could be open with options', (t) => {
  const encoderOptions = new ffmpeg.Dictionary()
  encoderOptions.set('preset', 'ultrafast')
  encoderOptions.set('tune', 'zerolatency')

  const codec = new ffmpeg.Codec('h264')
  const codecCtx = new ffmpeg.CodecContext(codec.encoder)
  setDefaultOptions(codecCtx)

  t.execution(() => {
    codecCtx.open(encoderOptions)
  })
})

function setDefaultOptions(ctx) {
  ctx.timeBase = new ffmpeg.Rational(1, 30) // TODO: add test when this option is missing
  ctx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P // TODO: same as above
  ctx.width = 100 // TODO: same as above
  ctx.height = 100 // TODO: same as above
}
