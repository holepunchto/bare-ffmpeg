const test = require('brittle')
const ffmpeg = require('..')

test('Decoder.byName() for vp8', (t) => {
  const decoder = ffmpeg.Decoder.byName('vp8')
  t.ok(decoder, 'vp8 decoder found')
  t.ok(decoder._handle, 'decoder has handle')
  t.is(decoder._codec.name, 'vp8', 'codec name is vp8')
})

test('Decoder.byName() for vp9', (t) => {
  const decoder = ffmpeg.Decoder.byName('vp9')
  t.ok(decoder, 'vp9 decoder found')
  t.ok(decoder._handle, 'decoder has handle')
  t.is(decoder._codec.name, 'vp9', 'codec name is vp9')
})

test('Decoder.byName() for h264', (t) => {
  const decoder = ffmpeg.Decoder.byName('h264')
  t.ok(decoder, 'h264 decoder found')
  t.ok(decoder._handle, 'decoder has handle')
  t.is(decoder._codec.name, 'h264', 'codec name is h264')
})

test('Decoder.byName() for libdav1d (AV1)', (t) => {
  const decoder = ffmpeg.Decoder.byName('libdav1d')
  t.ok(decoder, 'libdav1d decoder found')
  t.ok(decoder._handle, 'decoder has handle')
  t.is(decoder._codec.name, 'libdav1d', 'codec name is libdav1d')
})

test('Decoder.byName() throws for non-existent decoder', (t) => {
  t.exception(() => {
    ffmpeg.Decoder.byName('non_existent_decoder')
  })
})

test('VP8 encode and decode round-trip', (t) => {
  const width = 320
  const height = 240
  const frameRate = 30

  // Encode a frame
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

  using packet = new ffmpeg.Packet()
  encoderContext.sendFrame(frame)
  encoderContext.receivePacket(packet)

  // Decode the packet
  const decoder = ffmpeg.Decoder.byName('vp8')
  using decoderContext = new ffmpeg.CodecContext(decoder)
  decoderContext.width = width
  decoderContext.height = height
  decoderContext.open()

  using decodedFrame = new ffmpeg.Frame()
  decoderContext.sendPacket(packet)
  const decoded = decoderContext.receiveFrame(decodedFrame)

  t.ok(decoded, 'frame was decoded')
  t.is(decodedFrame.width, width, 'decoded width matches')
  t.is(decodedFrame.height, height, 'decoded height matches')
  t.is(decodedFrame.format, ffmpeg.constants.pixelFormats.YUV420P, 'decoded format matches')
})

test('VP9 encode and decode round-trip', (t) => {
  const width = 320
  const height = 240
  const frameRate = 30

  // Encode multiple frames (VP9 needs this)
  const encoder = ffmpeg.Encoder.byName('libvpx-vp9')
  using encoderContext = new ffmpeg.CodecContext(encoder)

  encoderContext.width = width
  encoderContext.height = height
  encoderContext.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  encoderContext.timeBase = new ffmpeg.Rational(1, frameRate)
  encoderContext.framerate = new ffmpeg.Rational(frameRate, 1)
  encoderContext.bitRate = 400000

  encoderContext.open()

  const packets = []

  for (let i = 0; i < 3; i++) {
    using frame = new ffmpeg.Frame()
    frame.width = width
    frame.height = height
    frame.format = ffmpeg.constants.pixelFormats.YUV420P
    frame.pts = i
    frame.alloc()

    encoderContext.sendFrame(frame)

    using packet = new ffmpeg.Packet()
    while (encoderContext.receivePacket(packet)) {
      packets.push(Buffer.from(packet.data))
      packet.unref()
    }
  }

  // Flush encoder
  encoderContext.sendFrame(null)
  using packet = new ffmpeg.Packet()
  while (encoderContext.receivePacket(packet)) {
    packets.push(Buffer.from(packet.data))
    packet.unref()
  }

  t.ok(packets.length > 0, 'frames were encoded')

  // Decode the first packet
  const decoder = ffmpeg.Decoder.byName('vp9')
  using decoderContext = new ffmpeg.CodecContext(decoder)
  decoderContext.width = width
  decoderContext.height = height
  decoderContext.open()

  using decodedPacket = new ffmpeg.Packet()
  decodedPacket.data = packets[0]

  using decodedFrame = new ffmpeg.Frame()
  decoderContext.sendPacket(decodedPacket)
  const decoded = decoderContext.receiveFrame(decodedFrame)

  t.ok(decoded, 'frame was decoded')
  t.is(decodedFrame.width, width, 'decoded width matches')
  t.is(decodedFrame.height, height, 'decoded height matches')
  t.is(decodedFrame.format, ffmpeg.constants.pixelFormats.YUV420P, 'decoded format matches')
})

test('decode VP9 from existing .webm file', (t) => {
  const video = require('./fixtures/video/sample.webm', {
    with: { type: 'binary' }
  })

  const io = new ffmpeg.IOContext(video)
  using format = new ffmpeg.InputFormatContext(io)

  const videoStream = format.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
  t.ok(videoStream, 'found video stream')

  const codecName = videoStream.codec.name
  t.ok(codecName === 'vp8' || codecName === 'vp9', `webm uses VP8/VP9 (found: ${codecName})`)

  using decoder = videoStream.decoder()
  decoder.open()

  using packet = new ffmpeg.Packet()
  using frame = new ffmpeg.Frame()

  let frameCount = 0
  while (format.readFrame(packet)) {
    if (packet.streamIndex !== videoStream.index) {
      packet.unref()
      continue
    }

    decoder.sendPacket(packet)
    while (decoder.receiveFrame(frame)) {
      frameCount++
      t.ok(frame.width > 0, `frame ${frameCount} has valid width`)
      t.ok(frame.height > 0, `frame ${frameCount} has valid height`)
      frame.unref()
    }
    packet.unref()
  }

  t.ok(frameCount > 0, `decoded ${frameCount} frames from webm`)
})
