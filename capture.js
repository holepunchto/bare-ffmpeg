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

let ret = inputFormatContext.readFrame(packet)
if (ret < 0) {
  console.error('Failed to read frame')
  process.exit(1)
}

rawDecoder.sendPacket(packet)

ret = rawDecoder.receiveFrame(rawFrame)
if (ret) {
  console.log('Successfully decoded first frame!')
} else {
  console.error('Failed to decode frame')
}

packet.unref()

// const h264Codec = ffmpeg.Codec('libx264')
// const h264Encoder = ffmpeg.Encoder(h264Codec);
