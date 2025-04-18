const ffmpeg = require('.')

const inputFormat = new ffmpeg.InputFormat()
const options = new ffmpeg.Dictionary()
options.set('framerate', '30')
options.set('video_size', '1280x720')
options.set('pixel_format', 'uyvy422')

const inputFormatContext = new ffmpeg.InputFormatContext(inputFormat, options)

const bestStream = inputFormatContext.getBestStream()
if (!bestStream) {
  console.error('Best stream not found')
  process.exit(1)
}

const rawDecoder = bestStream.decoder()
rawDecoder.open()

const packet = new ffmpeg.Packet()
const rawFrame = new ffmpeg.Frame()
const yuvFrame = new ffmpeg.Frame()
yuvFrame.width = 1280
yuvFrame.height = 720
yuvFrame.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
yuvFrame.alloc()

const scaler = new ffmpeg.Scaler(
  rawDecoder.pixelFormat,
  rawDecoder.width,
  rawDecoder.height,
  ffmpeg.constants.pixelFormats.YUV420P,
  rawDecoder.width,
  rawDecoder.height
)

let ret = inputFormatContext.readFrame(packet)
if (ret < 0) {
  console.error('Failed to read frame')
  process.exit(1)
}

rawDecoder.sendPacket(packet)
ret = rawDecoder.receiveFrame(rawFrame)
if (ret) {
  console.log('Successfully decoded first frame!')

  scaler.scale(rawFrame, yuvFrame)
  console.log('Successfully converted frame to YUV420P!')
} else {
  console.error('Failed to decode frame')
}

packet.unref()
