const test = require('brittle')
const ffmpeg = require('..')

test('getSupportedConfig for pixel formats', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const pixFormats = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.PIX_FORMAT
  )

  t.ok(pixFormats instanceof Int32Array, 'returns Int32Array')
  t.ok(pixFormats.length > 0, 'has pixel formats')

  codecCtx.destroy()
})

test('getSupportedConfig for sample formats', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  const sampleFormats = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.SAMPLE_FORMAT
  )

  t.ok(sampleFormats instanceof Int32Array, 'returns Int32Array')
  t.ok(sampleFormats.length > 0, 'has sample formats')

  codecCtx.destroy()
})

test('getSupportedConfig for sample rates', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  const sampleRates = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.SAMPLE_RATE
  )

  t.ok(sampleRates instanceof Int32Array, 'returns Int32Array')
  t.ok(sampleRates.length > 0, 'has sample rates')

  codecCtx.destroy()
})

test('getSupportedConfig for color range', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const colorRanges = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.COLOR_RANGE
  )

  t.ok(colorRanges instanceof Int32Array, 'returns Int32Array')
  t.ok(colorRanges.length > 0, 'has color ranges')

  codecCtx.destroy()
})

test('getSupportedConfig for color space', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const colorSpaces = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.COLOR_SPACE
  )

  t.ok(colorSpaces instanceof Int32Array, 'returns Int32Array')
  t.ok(colorSpaces.length > 0, 'has color spaces')

  codecCtx.destroy()
})

test('getSupportedConfig for frame rates', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const frameRates = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.FRAME_RATE
  )
  t.is(frameRates, null, 'all possible frame rates are accepted')
  codecCtx.destroy()
})

test('getSupportedConfig for channel layouts', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.encoder)
  const channelLayouts = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.CHANNEL_LAYOUT
  )
  t.is(channelLayouts, null, 'all possible channel layouts are accepted')
  codecCtx.destroy()
})
