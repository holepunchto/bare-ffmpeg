const test = require('brittle')
const ffmpeg = require('..')

test('getSupportedConfig for pixel formats', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const pixFormats = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.PIX_FORMAT)

  t.ok(pixFormats instanceof Int32Array, 'returns Int32Array')
  t.ok(pixFormats.length > 0, 'has pixel formats')
})

test('getSupportedConfig for sample formats', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  const sampleFormats = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.SAMPLE_FORMAT)

  t.ok(sampleFormats instanceof Int32Array, 'returns Int32Array')
  t.ok(sampleFormats.length > 0, 'has sample formats')
})

test('getSupportedConfig for sample rates', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  const sampleRates = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.SAMPLE_RATE)

  t.ok(sampleRates instanceof Int32Array, 'returns Int32Array')
  t.ok(sampleRates.length > 0, 'has sample rates')
})

test('getSupportedConfig for color range', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const colorRanges = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.COLOR_RANGE)

  t.ok(colorRanges instanceof Int32Array, 'returns Int32Array')
  t.ok(colorRanges.length > 0, 'has color ranges')
})

test('getSupportedConfig for color space', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const colorSpaces = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.COLOR_SPACE)

  t.ok(colorSpaces instanceof Int32Array, 'returns Int32Array')
  t.ok(colorSpaces.length > 0, 'has color spaces')
})

test('getSupportedConfig for frame rates', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const frameRates = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.FRAME_RATE)
  t.is(frameRates, null, 'all possible frame rates are accepted')
})

test('getSupportedConfig for channel layouts', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.encoder)
  const channelLayouts = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.CHANNEL_LAYOUT)
  t.is(channelLayouts, null, 'all possible channel layouts are accepted')
})

test('getSupportedConfig from a codec, with no context', (t) => {
  const { codecConfig } = ffmpeg.constants

  const pixelFormats = ffmpeg.Codec.AV1.encoder.getSupportedConfig(codecConfig.PIX_FORMAT)
  t.ok(pixelFormats instanceof Int32Array, 'returns Int32Array')
  t.ok(pixelFormats.length > 0, 'has pixel formats')

  const sampleRates = ffmpeg.Codec.AAC.encoder.getSupportedConfig(codecConfig.SAMPLE_RATE)
  t.ok(sampleRates instanceof Int32Array, 'returns Int32Array')
  t.ok(sampleRates.length > 0, 'has sample rates')

  const channelLayouts = ffmpeg.Codec.AAC.encoder.getSupportedConfig(codecConfig.CHANNEL_LAYOUT)
  t.is(channelLayouts, null, 'all possible channel layouts are accepted')

  const frameRates = new ffmpeg.Encoder('mjpeg').getSupportedConfig(codecConfig.FRAME_RATE)
  t.is(frameRates, null, 'all possible frame rates are accepted')
})

test('a context answers for its options, a codec in general', (t) => {
  const { codecConfig, codecs, colorRange } = ffmpeg.constants

  const mjpeg = ffmpeg.Codec.for(codecs.MJPEG)

  using codecCtx = new ffmpeg.CodecContext(mjpeg.encoder)
  codecCtx.setOption('strict', 'unofficial')

  t.alike(
    Array.from(codecCtx.getSupportedConfig(codecConfig.COLOR_RANGE)),
    [colorRange.MPEG, colorRange.JPEG],
    'the context accepts both ranges'
  )

  t.alike(
    Array.from(mjpeg.encoder.getSupportedConfig(codecConfig.COLOR_RANGE)),
    [colorRange.JPEG],
    'the codec alone only the JPEG range'
  )
})
