const ffmpeg = require('.')

const inputFormat = new ffmpeg.InputFormat()
const options = new ffmpeg.Dictionary()
options.set('framerate', '30')
options.set('video_size', '1280x720')
options.set('pixel_format', 'uyvy422')

const inputFormatContext = new ffmpeg.InputFormatContext(inputFormat, options)
const videoStreamIndex = inputFormatContext.getBestStreamIndex()
const bestStream = inputFormatContext.getBestStream()
if (!bestStream) {
  console.error('Best stream not found')
  process.exit(1)
}
console.log('Found best stream with codec:', bestStream.codec)

const rawDecoder = bestStream.decoder()

// Allocate frames and packet
const packet = new ffmpeg.Packet()
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

// Set up encoder
const encoderOptions = new ffmpeg.Dictionary()
encoderOptions.set('preset', 'ultrafast')
encoderOptions.set('tune', 'zerolatency')
const codec = new ffmpeg.Codec('h264')
const enc = codec.encoder
const enc_ctx = new ffmpeg.CodecContext(enc)
enc_ctx.width = rawDecoder.width
enc_ctx.height = rawDecoder.height
enc_ctx.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
enc_ctx.timeBase = new ffmpeg.Rational(1, 30)
enc_ctx.open()

let pts = 0

while (true) {
  const ret = inputFormatContext.readFrame(packet)
  if (!ret) continue

  rawDecoder.sendPacket(packet)
  packet.unref()

  while (rawDecoder.receiveFrame(rawFrame)) {
    console.log('1 - decoded frame')

    scaler.scale(rawFrame, yuvFrame)
    console.log('2 - scale frame to yuv')
    yuvFrame.pts = pts++

    enc_ctx.sendFrame(yuvFrame)
    console.log('3 - send frame')

    while (enc_ctx.receivePacket(packet)) {
      console.log('4 - encoded packet')
      packet.unref()
    }
  }
}
