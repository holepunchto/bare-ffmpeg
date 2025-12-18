const test = require('brittle')
const ffmpeg = require('..')

test('Encoder.byName() for libvpx (VP8)', (t) => {
  const encoder = ffmpeg.Encoder.byName('libvpx')
  t.ok(encoder, 'libvpx encoder found')
  t.ok(encoder._handle, 'encoder has handle')
  t.is(encoder._codec.name, 'libvpx', 'codec name is libvpx')
})

test('Encoder.byName() for libvpx-vp9 (VP9)', (t) => {
  const encoder = ffmpeg.Encoder.byName('libvpx-vp9')
  t.ok(encoder, 'libvpx-vp9 encoder found')
  t.ok(encoder._handle, 'encoder has handle')
  t.is(encoder._codec.name, 'libvpx-vp9', 'codec name is libvpx-vp9')
})

test('Encoder.byName() for libsvtav1 (AV1)', (t) => {
  const encoder = ffmpeg.Encoder.byName('libsvtav1')
  t.ok(encoder, 'libsvtav1 encoder found')
  t.ok(encoder._handle, 'encoder has handle')
  t.is(encoder._codec.name, 'libsvtav1', 'codec name is libsvtav1')
})

test('Encoder.byName() for libopus (OPUS)', (t) => {
  const encoder = ffmpeg.Encoder.byName('libopus')
  t.ok(encoder, 'libopus encoder found')
  t.ok(encoder._handle, 'encoder has handle')
  t.is(encoder._codec.name, 'libopus', 'codec name is libopus')
})

test('Encoder.byName() throws for non-existent encoder', (t) => {
  t.exception(() => {
    ffmpeg.Encoder.byName('non_existent_encoder')
  })
})

test('VP8 encoder encodes a frame', (t) => {
  const width = 320
  const height = 240
  const frameRate = 30

  const encoder = ffmpeg.Encoder.byName('libvpx')
  using encoderContext = new ffmpeg.CodecContext(encoder)

  encoderContext.width = width
  encoderContext.height = height
  encoderContext.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  encoderContext.timeBase = new ffmpeg.Rational(1, frameRate)
  encoderContext.framerate = new ffmpeg.Rational(frameRate, 1)
  encoderContext.bitRate = 400000

  encoderContext.open()

  using frame = new ffmpeg.Frame()
  frame.width = width
  frame.height = height
  frame.format = ffmpeg.constants.pixelFormats.YUV420P
  frame.pts = 0
  frame.alloc()

  encoderContext.sendFrame(frame)

  using packet = new ffmpeg.Packet()
  const encoded = encoderContext.receivePacket(packet)

  t.ok(encoded, 'frame was encoded')
  t.ok(packet.data.length > 0, 'packet has data')
})

test('VP9 encoder encodes multiple frames', (t) => {
  const width = 160
  const height = 120
  const frameRate = 30
  const numFrames = 5

  const encoder = ffmpeg.Encoder.byName('libvpx-vp9')
  using encoderContext = new ffmpeg.CodecContext(encoder)

  encoderContext.width = width
  encoderContext.height = height
  encoderContext.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  encoderContext.timeBase = new ffmpeg.Rational(1, frameRate)
  encoderContext.framerate = new ffmpeg.Rational(frameRate, 1)
  encoderContext.bitRate = 200000

  encoderContext.open()

  let encodedPackets = 0

  for (let i = 0; i < numFrames; i++) {
    using frame = new ffmpeg.Frame()
    frame.width = width
    frame.height = height
    frame.format = ffmpeg.constants.pixelFormats.YUV420P
    frame.pts = i
    frame.alloc()

    encoderContext.sendFrame(frame)

    using packet = new ffmpeg.Packet()
    while (encoderContext.receivePacket(packet)) {
      t.ok(packet.data.length > 0, `packet ${encodedPackets} has data`)
      encodedPackets++
      packet.unref()
    }
  }

  // Flush encoder
  encoderContext.sendFrame(null)
  using packet = new ffmpeg.Packet()
  while (encoderContext.receivePacket(packet)) {
    encodedPackets++
    packet.unref()
  }

  t.ok(encodedPackets > 0, `encoded ${encodedPackets} packets`)
})

test('AV1 encoder (libsvtav1) encodes frames', (t) => {
  const width = 160
  const height = 120
  const frameRate = 30

  const encoder = ffmpeg.Encoder.byName('libsvtav1')
  using encoderContext = new ffmpeg.CodecContext(encoder)

  encoderContext.width = width
  encoderContext.height = height
  encoderContext.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  encoderContext.timeBase = new ffmpeg.Rational(1, frameRate)
  encoderContext.framerate = new ffmpeg.Rational(frameRate, 1)
  encoderContext.bitRate = 200000

  encoderContext.open()

  using frame = new ffmpeg.Frame()
  frame.width = width
  frame.height = height
  frame.format = ffmpeg.constants.pixelFormats.YUV420P
  frame.pts = 0
  frame.alloc()

  encoderContext.sendFrame(frame)

  let encodedPackets = 0
  using packet = new ffmpeg.Packet()
  while (encoderContext.receivePacket(packet)) {
    encodedPackets++
    packet.unref()
  }

  // Flush to get any delayed frames
  encoderContext.sendFrame(null)
  while (encoderContext.receivePacket(packet)) {
    encodedPackets++
    packet.unref()
  }

  t.ok(encodedPackets > 0, `encoded ${encodedPackets} packets with AV1`)
})
