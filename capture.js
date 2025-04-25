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
const codec = new ffmpeg.Codec('h264')

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

// Set up toRGB scaler
const toRGB = new ffmpeg.Scaler(
  ffmpeg.constants.pixelFormats.YUV420P,
  rawDecoder.width,
  rawDecoder.height,
  ffmpeg.constants.pixelFormats.RGB24,
  rawDecoder.width,
  rawDecoder.height
)

const rgbaFrame = new ffmpeg.Frame()
rgbaFrame.width = rawDecoder.width
rgbaFrame.height = rawDecoder.height
rgbaFrame.pixelFormat = ffmpeg.constants.pixelFormats.RGB24
rgbaFrame.alloc()

function record() {
  // Allocate frames and packet
  const rawFrame = new ffmpeg.Frame()
  const yuvFrame = new ffmpeg.Frame()
  yuvFrame.width = rawDecoder.width
  yuvFrame.height = rawDecoder.height
  yuvFrame.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  yuvFrame.alloc()

  // Set up scaler
  const scaler = new ffmpeg.Scaler(
    rawDecoder.pixelFormat,
    rawDecoder.width,
    rawDecoder.height,
    ffmpeg.constants.pixelFormats.YUV420P,
    yuvFrame.width,
    yuvFrame.height
  )

  const packet = new ffmpeg.Packet()
  while (playback.poll()) {
    const ret = inputFormatContext.readFrame(packet)
    if (!ret) continue

    rawDecoder.sendPacket(packet)
    packet.unref()

    while (rawDecoder.receiveFrame(rawFrame)) {
      console.log('1 - decoded frame')

      scaler.scale(rawFrame, yuvFrame)
      console.log('2 - scale frame to yuv')

      encoderContext.sendFrame(yuvFrame)
      console.log('3 - send frame')

      while (encoderContext.receivePacket(packet)) {
        console.log('4 - encoded packet')
        decode(packet)
      }
    }
  }
}

function decode(packet) {
  decoderContext.sendPacket(packet)
  packet.unref()

  const decodedFrame = new ffmpeg.Frame()
  while (decoderContext.receiveFrame(decodedFrame)) {
    console.log('5 - decoded frame')
    toRGB.scale(decodedFrame, rgbaFrame)
    console.log('6 - scale frame to rgba')
    playback.render(rgbaFrame)
  }
}

record()
