const test = require('brittle')
const ffmpeg = require('..')

test('getSupportedConfig for pixel formats', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const pixFormats = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.PIX_FORMAT
  )

  if (pixFormats) {
    t.ok(pixFormats instanceof Int32Array, 'returns Int32Array')
    t.ok(pixFormats.length > 0, 'has pixel formats')
  } else {
    t.pass('no specific pixel formats (unbounded)')
  }

  codecCtx.destroy()
})

test('getSupportedConfig for sample formats', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  const sampleFormats = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.SAMPLE_FORMAT
  )

  if (sampleFormats) {
    t.ok(sampleFormats instanceof Int32Array, 'returns Int32Array')
    t.ok(sampleFormats.length > 0, 'has sample formats')
  } else {
    t.pass('no specific sample formats (unbounded)')
  }

  codecCtx.destroy()
})

test('getSupportedConfig for sample rates', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  const sampleRates = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.SAMPLE_RATE
  )

  if (sampleRates) {
    t.ok(sampleRates instanceof Int32Array, 'returns Int32Array')
    t.ok(sampleRates.length > 0, 'has sample rates')
  } else {
    t.pass('no specific sample rates (unbounded)')
  }

  codecCtx.destroy()
})

test('getSupportedConfig for color range', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const colorRanges = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.COLOR_RANGE
  )

  if (colorRanges) {
    t.ok(colorRanges instanceof Int32Array, 'returns Int32Array')
    t.ok(colorRanges.length > 0, 'has color ranges')
  } else {
    t.pass('no specific color ranges (unbounded)')
  }

  codecCtx.destroy()
})

test('getSupportedConfig for color space', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const colorSpaces = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.COLOR_SPACE
  )

  if (colorSpaces) {
    t.ok(colorSpaces instanceof Int32Array, 'returns Int32Array')
    t.ok(colorSpaces.length > 0, 'has color spaces')
  } else {
    t.pass('no specific color spaces (unbounded)')
  }

  codecCtx.destroy()
})

test('getSupportedConfig for frame rates', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const frameRates = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.FRAME_RATE
  )

  if (frameRates) {
    t.ok(Array.isArray(frameRates), 'returns array')
    t.ok(frameRates.length > 0, 'has frame rates')
    t.ok(frameRates[0] instanceof ffmpeg.Rational, 'contains Rational objects')
  } else {
    t.pass('no specific frame rates (unbounded)')
  }

  codecCtx.destroy()
})

test('getSupportedConfig for channel layouts', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  const channelLayouts = codecCtx.getSupportedConfig(
    ffmpeg.constants.codecConfig.CHANNEL_LAYOUT
  )

  if (channelLayouts) {
    t.ok(Array.isArray(channelLayouts), 'returns array')
    t.ok(channelLayouts.length > 0, 'has channel layouts')
    t.ok(
      channelLayouts[0] instanceof ffmpeg.ChannelLayout,
      'contains ChannelLayout objects'
    )
  } else {
    t.pass('no specific channel layouts (unbounded)')
  }

  codecCtx.destroy()
})
