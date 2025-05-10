const ffmpeg = require('.')

// Set up device
// const inputFormat = new ffmpeg.InputFormat()
const options = new ffmpeg.Dictionary()
options.set('framerate', '30')
options.set('video_size', '1280x720')
options.set('pixel_format', 'uyvy422')
const inputFormatContext = new ffmpeg.InputFormatContext(
  new ffmpeg.InputFormat(),
  options
)
const bestStream = inputFormatContext.getBestStream()
if (!bestStream) {
  process.exit(1)
}

// Setup rawDecoder
const rawDecoder = bestStream.decoder()

// Set up codec
const codec = ffmpeg.Codec.H264

// Set up decoder
const decoderContext = new ffmpeg.CodecContext(codec.decoder)
decoderContext.open()

// Set up encoder
const encoderOptions = new ffmpeg.Dictionary()
encoderOptions.set('preset', 'ultrafast')
encoderOptions.set('tune', 'zerolatency')
const encoderContext = new ffmpeg.CodecContext(codec.encoder)
encoderContext.width = rawDecoder.width
encoderContext.height = rawDecoder.height
encoderContext.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
encoderContext.timeBase = new ffmpeg.Rational(1, 30)
encoderContext.open(encoderOptions)

// Set up playback
const playback = new ffmpeg.Playback(rawDecoder.height, rawDecoder.width)

// Allocate frames
const rawFrame = new ffmpeg.Frame()
const yuvFrame = new ffmpeg.Frame()
yuvFrame.width = rawDecoder.width
yuvFrame.height = rawDecoder.height
yuvFrame.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
yuvFrame.alloc()
const rgbaFrame = new ffmpeg.Frame()
rgbaFrame.width = rawDecoder.width
rgbaFrame.height = rawDecoder.height
rgbaFrame.pixelFormat = ffmpeg.constants.pixelFormats.RGB24
rgbaFrame.alloc()

// Set up toYUV  scaler
const toYUV = new ffmpeg.Scaler(
  rawDecoder.pixelFormat,
  rawDecoder.width,
  rawDecoder.height,
  ffmpeg.constants.pixelFormats.YUV420P,
  yuvFrame.width,
  yuvFrame.height
)

// Set up toRGB scaler
const toRGB = new ffmpeg.Scaler(
  ffmpeg.constants.pixelFormats.YUV420P,
  rawDecoder.width,
  rawDecoder.height,
  ffmpeg.constants.pixelFormats.RGB24,
  rawDecoder.width,
  rawDecoder.height
)

function capture() {
  const packet = new ffmpeg.Packet()
  while (playback.poll()) {
    encode(packet)
  }
}

function encode(packet) {
  const ret = inputFormatContext.readFrame(packet)
  if (!ret) return

  rawDecoder.sendPacket(packet)
  packet.unref()

  while (rawDecoder.receiveFrame(rawFrame)) {
    console.log('1 - decoded frame')
    // NOTE: for Mafintosh
    // This were you can playback for the sender
    // playback.render(rawFrame)

    toYUV.scale(rawFrame, yuvFrame)
    console.log('2 - scale frame to yuv')

    encoderContext.sendFrame(yuvFrame)
    console.log('3 - send frame')

    while (encoderContext.receivePacket(packet)) {
      console.log('4 - encoded packet')
      // NOTE: for Mafintosh
      // This where you push to the swarm!
      decode(packet.buffer)
      packet.unref()
    }
  }
}

// NOTE: for Mafintosh
// This the function that you could use on the receiver side
function decode(buffer) {
  const packet = new ffmpeg.Packet(buffer)
  decoderContext.sendPacket(packet)
  packet.destroy()

  const decodedFrame = new ffmpeg.Frame()
  while (decoderContext.receiveFrame(decodedFrame)) {
    console.log('5 - decoded frame')
    toRGB.scale(decodedFrame, rgbaFrame)
    console.log('6 - scale frame to rgba')
    playback.render(rgbaFrame)
  }
}

capture()
