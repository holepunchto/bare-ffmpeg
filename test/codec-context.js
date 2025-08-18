const test = require('brittle')
const ffmpeg = require('..')

test('codec context could be open without options', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  setDefaultOptions(codecCtx)

  t.ok(codecCtx.open())
})

test('codec context could not open wihtout timebase', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  codecCtx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  codecCtx.width = 100
  codecCtx.height = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout pixelFormat', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  codecCtx.timeBase = new ffmpeg.Rational(1, 30)
  codecCtx.width = 100
  codecCtx.height = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout width', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  codecCtx.timeBase = new ffmpeg.Rational(1, 30)
  codecCtx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  codecCtx.height = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could not open wihtout height', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  codecCtx.timeBase = new ffmpeg.Rational(1, 30)
  codecCtx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  codecCtx.width = 100

  t.exception(() => {
    codecCtx.open()
  })
})

test('codec context could be open with options', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  setDefaultOptions(codecCtx)

  t.ok(codecCtx.open(getEncoderOptions()))
})

test('codec context should expose a sendFrame method', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open()
  const frame = fakeFrame()

  t.execution(() => {
    codecCtx.sendFrame(frame)
  })
})

test('codec context sendFrame should throw if codec is not open', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  setDefaultOptions(codecCtx)
  const frame = fakeFrame()

  t.exception(() => {
    codecCtx.sendFrame(frame)
  })
})

test('codec context should return false when buffer is full', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open()
  const frame = fakeFrame()

  t.plan(1)
  while (codecCtx.sendFrame(frame)) {} // Make the internal buffer full
  t.ok(true)
})

test('codec context should expose a receivePacket method', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open(getEncoderOptions())
  const frame = fakeFrame()
  codecCtx.sendFrame(frame)

  const packet = new ffmpeg.Packet()
  t.ok(codecCtx.receivePacket(packet))
  t.ok(packet.data.length > 0)
})

test('receivePacket should return false when options are not set', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open()
  const frame = fakeFrame()
  codecCtx.sendFrame(frame)

  const packet = new ffmpeg.Packet()
  t.absent(codecCtx.receivePacket(packet))
})

test('receivePacket should return false when no frame has been sent', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
  setDefaultOptions(codecCtx)
  codecCtx.open(getEncoderOptions())

  const packet = new ffmpeg.Packet()
  t.absent(codecCtx.receivePacket(packet))
})

test('codec context should expose framerate', (t) => {
  const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)

  t.ok(codecCtx.frameRate.uninitialized, 'empty timebase')

  setDefaultOptions(codecCtx)
  const fps = new ffmpeg.Rational(1, 30)
  codecCtx.frameRate = fps

  codecCtx.open()

  t.alike(codecCtx.frameRate, fps)
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

function fakeFrame() {
  const frame = new ffmpeg.Frame()
  frame.width = 100
  frame.height = 100
  frame.format = ffmpeg.constants.pixelFormats.YUV420P
  frame.alloc()

  return frame
}
