const ffmpeg = require('..')

console.log('VP8/VP9 WebM Decoding Example')
console.log('==============================\n')

// Load the sample WebM video
const video = require('../test/fixtures/video/sample.webm', {
  with: { type: 'binary' }
})

console.log(`Loaded WebM file: ${video.length} bytes\n`)

// Create IO context and format context
// Note: IOContext ownership transfers to InputFormatContext
const io = new ffmpeg.IOContext(video)
using format = new ffmpeg.InputFormatContext(io)

console.log('Format Information:')
console.log('-------------------')
const inputFormat = format.inputFormat
if (inputFormat) {
  console.log(`Format: ${inputFormat.name}`)
}
console.log(`Number of streams: ${format.streams.length}`)

// Find the video stream
const videoStream = format.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
if (!videoStream) {
  console.error('No video stream found in WebM file')
  process.exit(1)
}

console.log('\nVideo Stream Information:')
console.log('-------------------------')
console.log(`Stream index: ${videoStream.index}`)
console.log(`Codec: ${videoStream.codec.name}`)
console.log(`Time base: ${videoStream.timeBase.num}/${videoStream.timeBase.den}`)
console.log(`Duration: ${videoStream.duration}`)
console.log(`Number of frames: ${videoStream.nbFrames}`)

const codecParams = videoStream.codecParameters
console.log(`Dimensions: ${codecParams.width}x${codecParams.height}`)
console.log(`Pixel format: ${codecParams.format}`)
console.log(`Bit rate: ${codecParams.bitRate}`)

// Create decoder
const codecName = videoStream.codec.name
console.log(`\nCreating decoder for: ${codecName}`)

using decoder = videoStream.decoder()
decoder.open()
console.log('Decoder opened successfully')

// Decode frames
console.log('\nDecoding frames:')
console.log('----------------')

using packet = new ffmpeg.Packet()
using frame = new ffmpeg.Frame()

let frameCount = 0
let totalBytes = 0

while (format.readFrame(packet)) {
  // Only process packets from the video stream
  if (packet.streamIndex !== videoStream.index) {
    packet.unref()
    continue
  }

  totalBytes += packet.data.length

  decoder.sendPacket(packet)
  while (decoder.receiveFrame(frame)) {
    frameCount++

    // Print progress every 10 frames
    if (frameCount % 10 === 0) {
      console.log(
        `Frame ${frameCount}: ${frame.width}x${frame.height}, ` +
          `format: ${frame.format}, pts: ${frame.pts}, ` +
          `key frame: ${frame.keyFrame ? 'yes' : 'no'}`
      )
    }

    frame.unref()
  }
  packet.unref()
}

console.log('\nDecoding Summary:')
console.log('-----------------')
console.log(`Total frames decoded: ${frameCount}`)
console.log(`Total compressed data: ${totalBytes} bytes`)
console.log(`Average bytes per frame: ${Math.round(totalBytes / frameCount)} bytes`)
console.log('\nWebM decoding completed successfully!')
