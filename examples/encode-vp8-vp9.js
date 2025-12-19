const ffmpeg = require('..')

console.log('VP8/VP9 Encoding Example')
console.log('========================\n')

// Example 1: VP8 Encoding (WebM)
console.log('1. VP8 Encoding')
console.log('---------------')

const vp8Width = 320
const vp8Height = 240
const frameRate = 30

const vp8Encoder = new ffmpeg.Encoder('libvpx')
console.log('Found encoder: libvpx')

using vp8Context = new ffmpeg.CodecContext(vp8Encoder)
vp8Context.width = vp8Width
vp8Context.height = vp8Height
vp8Context.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
vp8Context.timeBase = new ffmpeg.Rational(1, frameRate)
vp8Context.framerate = new ffmpeg.Rational(frameRate, 1)
vp8Context.bitRate = 400000

vp8Context.open()
console.log(
  `VP8 encoder opened: ${vp8Width}x${vp8Height} @ ${frameRate}fps, bitrate: ${vp8Context.bitRate}`
)

using vp8Frame = new ffmpeg.Frame()
vp8Frame.width = vp8Width
vp8Frame.height = vp8Height
vp8Frame.format = ffmpeg.constants.pixelFormats.YUV420P
vp8Frame.pts = 0
vp8Frame.alloc()

using vp8Packet = new ffmpeg.Packet()
vp8Context.sendFrame(vp8Frame)
const vp8Encoded = vp8Context.receivePacket(vp8Packet)

console.log(`Encoded VP8 frame: ${vp8Encoded ? 'success' : 'failed'}`)
console.log(`VP8 packet size: ${vp8Packet.data.length} bytes\n`)

// Example 2: VP9 Encoding (WebM)
console.log('2. VP9 Encoding')
console.log('---------------')

const vp9Width = 160
const vp9Height = 120
const numFrames = 5

const vp9Encoder = new ffmpeg.Encoder('libvpx-vp9')
console.log('Found encoder: libvpx-vp9')

using vp9Context = new ffmpeg.CodecContext(vp9Encoder)
vp9Context.width = vp9Width
vp9Context.height = vp9Height
vp9Context.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
vp9Context.timeBase = new ffmpeg.Rational(1, frameRate)
vp9Context.framerate = new ffmpeg.Rational(frameRate, 1)
vp9Context.bitRate = 200000

vp9Context.open()
console.log(
  `VP9 encoder opened: ${vp9Width}x${vp9Height} @ ${frameRate}fps, bitrate: ${vp9Context.bitRate}`
)

let encodedPackets = 0
const packets = []

for (let i = 0; i < numFrames; i++) {
  using vp9Frame = new ffmpeg.Frame()
  vp9Frame.width = vp9Width
  vp9Frame.height = vp9Height
  vp9Frame.format = ffmpeg.constants.pixelFormats.YUV420P
  vp9Frame.pts = i
  vp9Frame.alloc()

  vp9Context.sendFrame(vp9Frame)

  using vp9Packet = new ffmpeg.Packet()
  while (vp9Context.receivePacket(vp9Packet)) {
    packets.push(Buffer.from(vp9Packet.data))
    encodedPackets++
    vp9Packet.unref()
  }
}

// Flush encoder to get any remaining packets
vp9Context.sendFrame(null)
using flushPacket = new ffmpeg.Packet()
while (vp9Context.receivePacket(flushPacket)) {
  packets.push(Buffer.from(flushPacket.data))
  encodedPackets++
  flushPacket.unref()
}

console.log(`Encoded ${numFrames} VP9 frames into ${encodedPackets} packets`)
console.log(`Total VP9 data: ${packets.reduce((sum, p) => sum + p.length, 0)} bytes\n`)

// Example 3: VP8/VP9 Encode-Decode Round-Trip
console.log('3. VP8 Encode-Decode Round-Trip')
console.log('--------------------------------')

// Encode with VP8
const rtWidth = 320
const rtHeight = 240

const rtEncoder = new ffmpeg.Encoder('libvpx')
using rtEncoderContext = new ffmpeg.CodecContext(rtEncoder)

rtEncoderContext.width = rtWidth
rtEncoderContext.height = rtHeight
rtEncoderContext.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
rtEncoderContext.timeBase = new ffmpeg.Rational(1, frameRate)
rtEncoderContext.framerate = new ffmpeg.Rational(frameRate, 1)
rtEncoderContext.bitRate = 400000

rtEncoderContext.open()

using rtFrame = new ffmpeg.Frame()
rtFrame.width = rtWidth
rtFrame.height = rtHeight
rtFrame.format = ffmpeg.constants.pixelFormats.YUV420P
rtFrame.pts = 0
rtFrame.alloc()

using rtPacket = new ffmpeg.Packet()
rtEncoderContext.sendFrame(rtFrame)
rtEncoderContext.receivePacket(rtPacket)

console.log(`Encoded frame: ${rtPacket.data.length} bytes`)

// Decode with VP8
const rtDecoder = new ffmpeg.Decoder('vp8')
using rtDecoderContext = new ffmpeg.CodecContext(rtDecoder)
rtDecoderContext.width = rtWidth
rtDecoderContext.height = rtHeight
rtDecoderContext.open()

using rtDecodedFrame = new ffmpeg.Frame()
rtDecoderContext.sendPacket(rtPacket)
const decoded = rtDecoderContext.receiveFrame(rtDecodedFrame)

console.log(`Decoded frame: ${decoded ? 'success' : 'failed'}`)
console.log(`Decoded dimensions: ${rtDecodedFrame.width}x${rtDecodedFrame.height}`)
console.log(
  `Decoded format: ${rtDecodedFrame.format} (expected ${ffmpeg.constants.pixelFormats.YUV420P})`
)

console.log('\nAll VP8/VP9 encoding examples completed successfully!')
