const ffmpeg = require('..')

const assert = require('bare-assert')
const os = require('bare-os')
const process = require('bare-process')

if (os.platform() !== 'darwin' && os.platform() !== 'ios') {
  console.log('This example only works on macOS/iOS with VideoToolbox')
  process.exit(1)
}

// This example demonstrates H264 hardware-accelerated decoding on macOS using VideoToolbox
// It decodes an H264 video frame using hardware acceleration, then transfers it to software

// Load a sample MP4 video (typically contains H264)
const video = require('../test/fixtures/video/sample.mp4', {
  with: { type: 'binary' }
})

// Create input context
const io = new ffmpeg.IOContext(video)
using format = new ffmpeg.InputFormatContext(io)

// Find video stream
const stream = format.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
const codec = ffmpeg.Codec.for(stream.codecParameters.id)
console.log('Video stream found:', {
  index: stream.index,
  codecId: stream.codecParameters.id,
  codecName: codec.name,
  width: stream.codecParameters.width,
  height: stream.codecParameters.height
})

// Verify it's H264
if (codec.name !== 'h264') {
  console.log(`Warning: Expected H264 codec, but got: ${codec.name}`)
  console.log('This example is designed for H264 video')
}

// Create hardware device context for VideoToolbox
console.log('Creating VideoToolbox hardware device context...')
using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)

// Create decoder and set hardware device
const decoder = stream.decoder()
decoder.hwDeviceCtx = hwDevice
console.log('Hardware device context set on decoder')

// Set getFormat callback to select hardware pixel format
let formatSelected = false
decoder.getFormat = (ctx, formats) => {
  console.log(
    'getFormat callback invoked with formats:',
    formats.map((f) => {
      try {
        return ffmpeg.constants.getPixelFormatName(f)
      } catch {
        return f
      }
    })
  )

  // Look for VideoToolbox hardware format
  const hwFormat = formats.find((f) => f === ffmpeg.constants.pixelFormats.VIDEOTOOLBOX)

  if (hwFormat) {
    console.log('Selected hardware format: VIDEOTOOLBOX')
    formatSelected = true
    return hwFormat
  }

  console.log('Hardware format not available, falling back to:', formats[0])
  return formats[0]
}

// Decoder open
decoder.open()
console.log('Decoder opened!')

// Decode first frame
using packet = new ffmpeg.Packet()
using hwFrame = new ffmpeg.Frame()

console.log('Decoding first H264 frame with hardware acceleration...')
let decoded = false
let framesAttempted = 0

while (format.readFrame(packet) && framesAttempted < 10) {
  if (packet.streamIndex !== stream.index) continue

  framesAttempted++

  decoder.sendPacket(packet)

  if (decoder.receiveFrame(hwFrame)) {
    decoded = true
    assert.equal(hwFrame.format, ffmpeg.constants.pixelFormats.VIDEOTOOLBOX)
    break
  }
}

assert(formatSelected, 'Hardware format should have been selected')
assert(decoded, 'Should have decoded at least one frame')

// Transfer to software frame
console.log('\nTransferring hardware frame to software memory...')
using swFrame = new ffmpeg.Frame()
swFrame.format = ffmpeg.constants.pixelFormats.NV12 // Common format for VideoToolbox output

try {
  hwFrame.transferData(swFrame)
  assert(swFrame.width > 0, 'Software frame should have width')
  assert(swFrame.height > 0, 'Software frame should have height')
  assert.equal(swFrame.format, ffmpeg.constants.pixelFormats.NV12)
} catch (err) {
  console.error('Transfer failed:', err.message)
  throw err
}

// Clean up decoder before format context
decoder.destroy()

console.log('\n✓ H264 hardware decoding with VideoToolbox successful!')
console.log('✓ Hardware → Software transfer successful!')
