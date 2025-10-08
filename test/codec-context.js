const test = require('brittle')
const ffmpeg = require('..')

test('codec context could be open without options', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  setDefaultOptions(codecCtx)

  t.execution(() => {
    codecCtx.open()
  })
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

  t.execution(() => {
    codecCtx.open(getEncoderOptions())
  })
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

test('CodecContext has read-only "frame-size"', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.encoder)
  t.is(codecCtx.frameSize, 0)
})

test('CodecContext has read-only "frame-number"', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.encoder)
  t.is(codecCtx.frameNum, 0)
})

test('CodecContext exports requestSampleFormat getter', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.decoder)
  t.is(codecCtx.requestSampleFormat, -1)
})

test('CodecContext exports requestSampleFormat setter', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.decoder)
  codecCtx.requestSampleFormat = ffmpeg.constants.sampleFormats.S16
  t.is(codecCtx.requestSampleFormat, ffmpeg.constants.sampleFormats.S16)
})

test('CodecContext should expose a getFormat callback setter', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.decoder)

  t.execution(() => {
    codecCtx.getFormat = function getFormat() {}
  })
})

test('CodecContext getFormat callback should expose context as an CodecContext instance', (t) => {
  const video = require('./fixtures/video/sample.webm', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(video)
  using format = new ffmpeg.InputFormatContext(io)

  using packet = new ffmpeg.Packet()
  using frame = new ffmpeg.Frame()

  const stream = format.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
  const decoder = stream.decoder()

  t.plan(1)
  decoder.getFormat = function getFormat(context, pixelFormats) {
    t.ok(context instanceof ffmpeg.CodecContext)
    const pixelFormat = pixelFormats.find(
      (fmt) => fmt === ffmpeg.constants.pixelFormats.YUV420P
    )
    return pixelFormat && -1
  }

  while (format.readFrame(packet)) {
    if (packet.streamIndex != stream.index) continue

    decoder.open()
    decoder.sendPacket(packet)
    decoder.receiveFrame(frame)
    packet.unref()
    break
  }
})

test('CodecContext getFormat callback should expose pixelFormats as an Array', (t) => {
  const video = require('./fixtures/video/sample.webm', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(video)
  using format = new ffmpeg.InputFormatContext(io)

  using packet = new ffmpeg.Packet()
  using frame = new ffmpeg.Frame()

  const stream = format.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
  const decoder = stream.decoder()

  t.plan(1)
  decoder.getFormat = function getFormat(_context, pixelFormats) {
    t.ok(Array.isArray(pixelFormats))
    const pixelFormat = pixelFormats.find(
      (fmt) => fmt === ffmpeg.constants.pixelFormats.YUV420P
    )
    return pixelFormat && -1
  }

  while (format.readFrame(packet)) {
    if (packet.streamIndex != stream.index) continue

    decoder.open()
    decoder.sendPacket(packet)
    decoder.receiveFrame(frame)
    packet.unref()
    break
  }
})

test('CodecContext can get an option', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  const threadCount = codecCtx.getOption('threads')
  t.is(threadCount, '1')
})

test('CodecContext.getOption returns null if option is unset', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  const params = codecCtx.getOption(
    'svtav1-params',
    ffmpeg.constants.optionFlags.SEARCH_CHILDREN |
      ffmpeg.constants.optionFlags.ALLOW_NULL
  )

  t.absent(params)
})

test('CodecContext.getOption throws if option is not found', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  t.exception(() => {
    codecCtx.getOption('nope-throws')
  }, /Option not found/)
})

test('CodecContext can get and set options', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  codecCtx.setOption('crf', '23')
  t.is(codecCtx.getOption('crf'), '23')

  codecCtx.setOption(
    'threads',
    '4',
    ffmpeg.constants.optionFlags.SEARCH_CHILDREN
  )
  t.is(
    codecCtx.getOption('threads', ffmpeg.constants.optionFlags.SEARCH_CHILDREN),
    '4'
  )
})

test('CodecContext.setOption throws if option is not found', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  t.exception(() => {
    codecCtx.setOption('nope-throws', 'error')
  }, /Option not found/)
})

test('CodecContext.listOptionNames returns array of names', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  const options = codecCtx.getOptions()
  t.ok(Object.hasOwn(options, 'svtav1-params'))
})

test('CodecContext.listOptionNames returns array of names', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  const names = codecCtx.listOptionNames()
  t.ok(Array.isArray(names))
  t.ok(names.length > 0)
  t.ok(names.includes('svtav1-params'))
})

test('CodecContext can set options via dictionary', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  const options = ffmpeg.Dictionary.from({
    crf: '20',
    preset: '1',
    threads: '8'
  })

  codecCtx.setOptionDictionary(options)
  t.is(codecCtx.getOption('crf'), '20')
  t.is(codecCtx.getOption('preset'), '1')
  t.is(codecCtx.getOption('threads'), '8')
})

test('CodecContext can set options via dictionary', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  const options = ffmpeg.Dictionary.from({
    crf: 'throws'
  })

  t.exception(() => {
    codecCtx.setOptionDictionary(options)
  }, /Invalid argument/)
})

test('CodecContext can set option defaults', (t) => {
  using codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  t.execution(() => {
    codecCtx.setOptionDefaults()
  })
})

test('CodecContext can copy options from another context', (t) => {
  using sourceCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  using targetCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  sourceCtx.setOption('b', '128000')
  sourceCtx.setOption('threads', '2')

  targetCtx.copyOptionsFrom(sourceCtx)
  t.is(targetCtx.getOption('b'), sourceCtx.getOption('b'))
  t.is(targetCtx.getOption('threads'), sourceCtx.getOption('threads'))
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
