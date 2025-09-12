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

test('codec context should expose bitRate accessor', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  t.is(codecCtx.bitRate, 0)
  codecCtx.bitRate = 1000000
  t.is(codecCtx.bitRate, 1000000)
  codecCtx.destroy()
})

test('codec context should expose frameSize accessor for audio', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  t.is(typeof codecCtx.frameSize, 'number')
  codecCtx.frameSize = 1024
  t.is(codecCtx.frameSize, 1024)
  codecCtx.destroy()
})

test('codec context should expose profile accessor', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  t.is(typeof codecCtx.profile, 'number')
  codecCtx.profile = ffmpeg.constants.profiles.AV1_MAIN
  t.is(codecCtx.profile, ffmpeg.constants.profiles.AV1_MAIN)
  codecCtx.destroy()
})

test('codec context should expose level accessor', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  t.is(typeof codecCtx.level, 'number')
  codecCtx.level = 31
  t.is(codecCtx.level, 31)
  codecCtx.destroy()
})

test('codec context should expose compressionLevel accessor', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  t.is(typeof codecCtx.compressionLevel, 'number')
  codecCtx.compressionLevel = 5
  t.is(codecCtx.compressionLevel, 5)
  codecCtx.destroy()
})

test('codec context should expose cutoff accessor for audio', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  t.is(typeof codecCtx.cutoff, 'number')
  codecCtx.cutoff = 15000
  t.is(codecCtx.cutoff, 15000)
  codecCtx.destroy()
})

test('codec context should expose threadCount accessor', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  t.is(typeof codecCtx.threadCount, 'number')
  codecCtx.threadCount = 4
  t.is(codecCtx.threadCount, 4)
  codecCtx.destroy()
})

test('codec context should expose rate control accessors', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  t.is(codecCtx.rcMaxRate, 0)
  t.is(codecCtx.rcMinRate, 0)

  codecCtx.rcMaxRate = 2000000
  codecCtx.rcMinRate = 500000

  t.is(codecCtx.rcMaxRate, 2000000)
  t.is(codecCtx.rcMinRate, 500000)

  codecCtx.destroy()
})

test('codec context should expose quality accessors', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  t.is(typeof codecCtx.qmin, 'number')
  t.is(typeof codecCtx.qmax, 'number')

  codecCtx.qmin = 10
  codecCtx.qmax = 35

  t.is(codecCtx.qmin, 10)
  t.is(codecCtx.qmax, 35)

  codecCtx.destroy()
})

test('audio encoder configuration should work with new properties', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.encoder)

  codecCtx.sampleRate = 48000
  codecCtx.sampleFormat = ffmpeg.constants.sampleFormats.S16
  codecCtx.channelLayout = ffmpeg.ChannelLayout.from(
    ffmpeg.constants.channelLayouts.STEREO
  )
  codecCtx.bitRate = 128000
  codecCtx.frameSize = 960
  codecCtx.timeBase = new ffmpeg.Rational(1, 48000)

  t.execution(() => {
    codecCtx.open()
  })

  t.is(codecCtx.bitRate, 128000)
  t.is(codecCtx.frameSize, 960)
  t.is(codecCtx.sampleRate, 48000)

  codecCtx.destroy()
})

test('video encoder configuration should work with new properties', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  setDefaultOptions(codecCtx)
  codecCtx.bitRate = 4000000
  codecCtx.profile = ffmpeg.constants.profiles.AV1_MAIN
  codecCtx.level = 31
  codecCtx.threadCount = 2
  codecCtx.qmin = 18
  codecCtx.qmax = 28
  codecCtx.gopSize = 60

  const options = getEncoderOptions()
  t.execution(() => {
    codecCtx.open(options)
  })

  t.is(codecCtx.bitRate, 4000000)
  t.is(codecCtx.profile, ffmpeg.constants.profiles.AV1_MAIN)
  t.is(codecCtx.level, 31)
  t.is(codecCtx.threadCount, 2)

  codecCtx.destroy()
})

test('codec parameters to context should not override direct settings', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AAC.encoder)
  const params = ffmpeg.CodecParameters.alloc()

  params.sampleRate = 44100
  params.bitRate = 64000
  params.nbChannels = 2
  params.format = ffmpeg.constants.sampleFormats.FLTP

  params.toContext(codecCtx)

  codecCtx.bitRate = 128000
  codecCtx.frameSize = 1024
  codecCtx.cutoff = 15000
  codecCtx.profile = ffmpeg.constants.profiles.AAC_LOW

  t.is(codecCtx.bitRate, 128000)
  t.is(codecCtx.frameSize, 1024)
  t.is(codecCtx.cutoff, 15000)
  t.is(codecCtx.profile, ffmpeg.constants.profiles.AAC_LOW)

  params.destroy()
  codecCtx.destroy()
})

test('audio encoder configuration should work with new properties', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.encoder)

  codecCtx.sampleRate = 48000
  codecCtx.sampleFormat = ffmpeg.constants.sampleFormats.S16
  codecCtx.channelLayout = ffmpeg.ChannelLayout.from(
    ffmpeg.constants.channelLayouts.STEREO
  )
  codecCtx.bitRate = 128000
  codecCtx.frameSize = 960 // 20ms at 48kHz for Opus
  codecCtx.timeBase = new ffmpeg.Rational(1, 48000)

  t.execution(() => {
    codecCtx.open()
  })

  t.is(codecCtx.bitRate, 128000)
  t.is(codecCtx.frameSize, 960)
  t.is(codecCtx.sampleRate, 48000)

  codecCtx.destroy()
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
