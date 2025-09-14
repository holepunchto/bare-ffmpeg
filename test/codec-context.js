const test = require('brittle')
const ffmpeg = require('..')

test('codec context could be open without options', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  setDefaultOptions(codecCtx)

  t.ok(codecCtx.open())
})

test('codec context could not open wihtout timebase', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  codecCtx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  codecCtx.width = 100
  codecCtx.height = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout pixelFormat', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  codecCtx.timeBase = new ffmpeg.Rational(1, 30)
  codecCtx.width = 100
  codecCtx.height = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout width', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  codecCtx.timeBase = new ffmpeg.Rational(1, 30)
  codecCtx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  codecCtx.height = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout height', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  codecCtx.timeBase = new ffmpeg.Rational(1, 30)
  codecCtx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  codecCtx.width = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could be open with options', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  setDefaultOptions(codecCtx)

  t.ok(codecCtx.open(getEncoderOptions()))
})

test('codec context should expose a sendFrame method', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open()
  const frame = fakeFrame()

  t.execution(() => {
    codecCtx.sendFrame(frame)
  })
})

test('codec context sendFrame should throw if codec is not open', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  setDefaultOptions(codecCtx)
  const frame = fakeFrame()

  t.exception(() => {
    codecCtx.sendFrame(frame)
  })
})

test('codec context should return false when buffer is full', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open()
  const frame = fakeFrame()

  t.plan(1)
  while (codecCtx.sendFrame(frame)) {} // Make the internal buffer full
  t.ok(true)
})

test('codec context should expose a receivePacket method', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open(getEncoderOptions())
  const frame = fakeFrame()
  while (codecCtx.sendFrame(frame)) {} // Make the internal buffer full

  const packet = new ffmpeg.Packet()
  t.ok(codecCtx.receivePacket(packet))
  t.ok(packet.data.length > 0)
})

test('receivePacket should return false when options are not set', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open()
  const frame = fakeFrame()
  codecCtx.sendFrame(frame)

  const packet = new ffmpeg.Packet()
  t.absent(codecCtx.receivePacket(packet))
})

test('receivePacket should return false when no frame has been sent', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open(getEncoderOptions())

  const packet = new ffmpeg.Packet()
  t.absent(codecCtx.receivePacket(packet))
})

test('codec context should expose framerate', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  t.ok(codecCtx.frameRate.uninitialized, 'empty timebase')

  setDefaultOptions(codecCtx)
  const fps = new ffmpeg.Rational(1, 30)
  codecCtx.frameRate = fps

  codecCtx.open()

  t.alike(codecCtx.frameRate, fps)
})

test('CodecContext class should expose a extraData getter', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  t.ok(codecCtx.extraData instanceof Buffer)
  codecCtx.destroy()
})

test('CodecContext class should expose a extraData setter', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const buf = Buffer.from('test')
  codecCtx.extraData = buf

  t.ok(codecCtx.extraData[0] === 't'.charCodeAt(0))
  t.ok(codecCtx.extraData[1] === 'e'.charCodeAt(0))
  t.ok(codecCtx.extraData[2] === 's'.charCodeAt(0))
  t.ok(codecCtx.extraData[3] === 't'.charCodeAt(0))
})

test('codec context - avoptions string', (t) => {
  const codec = ffmpeg.Codec.AV1.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.width = 640
  ctx.height = 480
  ctx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  ctx.timeBase = new ffmpeg.Rational(1, 30)

  // av1 encoder has a profile option that accepts strings like 'main', 'high', 'professional'
  ctx.setOption('profile', 'main')
  ctx.open()

  // ffmpeg converts 'main' to 0 internally
  const profile = ctx.getOptionInt('profile')
  t.is(profile, 0, 'should get option value converted to int')

  ctx.destroy()
})

test('codec context - avoptions integer', (t) => {
  const codec = ffmpeg.Codec.AV1.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.width = 640
  ctx.height = 480
  ctx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  ctx.timeBase = new ffmpeg.Rational(1, 30)

  ctx.setOptionInt('crf', 23)
  ctx.open()

  const crf = ctx.getOptionInt('crf')
  t.is(crf, 23, 'should get integer option value')

  ctx.destroy()
})

test('codec context - avoptions rational', (t) => {
  const codec = ffmpeg.Codec.AV1.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.width = 640
  ctx.height = 480
  ctx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  ctx.timeBase = new ffmpeg.Rational(1, 30)

  ctx.setOptionRational('aspect', 16, 9)
  ctx.open()

  const aspect = ctx.getOptionRational('aspect')
  t.is(aspect.numerator, 16, 'should get rational numerator')
  t.is(aspect.denominator, 9, 'should get rational denominator')

  ctx.destroy()
})

test('codec context - avoptions with flags', (t) => {
  const codec = ffmpeg.Codec.AV1.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.width = 640
  ctx.height = 480
  ctx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  ctx.timeBase = new ffmpeg.Rational(1, 30)

  ctx.setOption('profile', 'main', ffmpeg.constants.optionFlags.SEARCH_CHILDREN)
  ctx.open()

  // ffmpeg converts "main" to '0' internally for AV1
  const profile = ctx.getOption(
    'profile',
    ffmpeg.constants.optionFlags.SEARCH_CHILDREN
  )
  t.is(profile, '0', 'should get option with flags (converted to int string)')

  ctx.destroy()
})

test('codec context - opus bitrate option', (t) => {
  const codec = ffmpeg.Codec.OPUS.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.sampleFormat = ffmpeg.constants.sampleFormats.S16
  ctx.sampleRate = 48000
  ctx.channelLayout = ffmpeg.ChannelLayout.from(
    ffmpeg.constants.channelLayouts.STEREO
  )

  ctx.setOptionInt('b', 128000)
  ctx.open()

  const bitrate = ctx.getOptionInt('b')
  t.is(bitrate, 128000, 'should get bitrate option value')

  ctx.destroy()
})

test('codec context - opus vbr string option', (t) => {
  const codec = ffmpeg.Codec.OPUS.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.sampleFormat = ffmpeg.constants.sampleFormats.S16
  ctx.sampleRate = 48000
  ctx.channelLayout = ffmpeg.ChannelLayout.from(
    ffmpeg.constants.channelLayouts.STEREO
  )

  ctx.setOption('vbr', 'on')
  ctx.open()

  // ffmpeg converts 'on' to '1'
  const vbr = ctx.getOption('vbr')
  t.is(vbr, '1', 'should get vbr option value converted to int string')

  ctx.destroy()
})

test('codec context - opus compression_level option', (t) => {
  const codec = ffmpeg.Codec.OPUS.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.sampleFormat = ffmpeg.constants.sampleFormats.S16
  ctx.sampleRate = 48000
  ctx.channelLayout = ffmpeg.ChannelLayout.from(
    ffmpeg.constants.channelLayouts.STEREO
  )

  ctx.setOptionInt('compression_level', 5)
  ctx.open()

  const level = ctx.getOptionInt('compression_level')
  t.is(level, 5, 'should get compression_level option value')

  ctx.destroy()
})

test('codec context - opus frame_duration option', (t) => {
  const codec = ffmpeg.Codec.OPUS.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.sampleFormat = ffmpeg.constants.sampleFormats.S16
  ctx.sampleRate = 48000
  ctx.channelLayout = ffmpeg.ChannelLayout.from(
    ffmpeg.constants.channelLayouts.STEREO
  )

  ctx.setOptionDouble('frame_duration', 20.0)
  ctx.open()

  const duration = ctx.getOptionDouble('frame_duration')
  t.is(duration, 20.0, 'should get frame_duration option value')

  ctx.destroy()
})

test('codec context - opus application option', (t) => {
  const codec = ffmpeg.Codec.OPUS.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.sampleFormat = ffmpeg.constants.sampleFormats.S16
  ctx.sampleRate = 48000
  ctx.channelLayout = ffmpeg.ChannelLayout.from(
    ffmpeg.constants.channelLayouts.STEREO
  )

  ctx.setOption('application', 'audio')
  ctx.open()

  const app = ctx.getOption('application')
  t.is(
    app,
    '2049',
    'should get application option value converted to int string'
  )

  ctx.destroy()
})

test('codec context - invalid option should throw', (t) => {
  const codec = ffmpeg.Codec.AV1.encoder
  const ctx = new ffmpeg.CodecContext(codec)

  ctx.width = 640
  ctx.height = 480
  ctx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  ctx.timeBase = new ffmpeg.Rational(1, 30)

  t.exception(() => {
    ctx.setOption('invalid_option_name_that_does_not_exist', 'value')
  }, /Option not found/)

  ctx.destroy()
})

function setDefaultOptions(ctx) {
  ctx.timeBase = new ffmpeg.Rational(1, 30)
  ctx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  ctx.width = 100
  ctx.height = 100
}

function getEncoderOptions() {
  const encoderOptions = new ffmpeg.Dictionary()
  return encoderOptions
}

function fakeFrame() {
  const frame = new ffmpeg.Frame()
  frame.width = 100
  frame.height = 100
  frame.format = ffmpeg.constants.pixelFormats.YUV420P
  frame.alloc()

  return frame
}
