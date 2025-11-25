const ffmpeg = require('..')

const assert = require('bare-assert')
const os = require('bare-os')
const process = require('bare-process')

if (os.platform() !== 'darwin' && os.platform() !== 'ios') {
  process.exit(1)
}

// This example demonstrates hardware-accelerated decoding on macOS using VideoToolbox
// It decodes a video frame using hardware acceleration, then transfers it to software

// Load a sample video
const video = require('../test/fixtures/video/sample.webm', {
  with: { type: 'binary' }
})

// Create input context
const io = new ffmpeg.IOContext(video)
using format = new ffmpeg.InputFormatContext(io)

// Find video stream
const stream = format.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
console.log('Video stream found:', {
  index: stream.index,
  codecId: stream.codecParameters.id,
  width: stream.codecParameters.width,
  height: stream.codecParameters.height
})

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
  console.log('getFormat callback invoked with formats:', formats)

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

// Decode first frame
using packet = new ffmpeg.Packet()
using hwFrame = new ffmpeg.Frame()

console.log('Decoding first frame...')
let decoded = false
while (format.readFrame(packet)) {
  if (packet.streamIndex !== stream.index) continue

  decoder.open()
  decoder.sendPacket(packet)

  if (decoder.receiveFrame(hwFrame)) {
    decoded = true
    console.log('Frame decoded successfully')
    assert.equal(hwFrame.format, ffmpeg.constants.pixelFormats.VIDEOTOOLBOX)
    break
  }
}

assert(formatSelected, 'Hardware format should have been selected')
assert(decoded, 'Should have decoded at least one frame')

// Transfer to software frame
console.log('Transferring hardware frame to software...')
using swFrame = new ffmpeg.Frame()
swFrame.format = ffmpeg.constants.pixelFormats.NV12 // Common format for VideoToolbox

try {
  hwFrame.transferData(swFrame)
  console.log('Transfer successful!')
  console.log('Software frame format:', swFrame.format)
  console.log('Software frame dimensions:', swFrame.width, 'x', swFrame.height)
  assert(swFrame.width > 0, 'Software frame should have width')
  assert(swFrame.height > 0, 'Software frame should have height')
} catch (err) {
  console.error('Transfer failed:', err.message)
  throw err
}

// Clean up decoder before format context
decoder.destroy()

console.log('\n✓ Hardware decoding and transfer successful!')

// TODO: Demonstrate software → hardware transfer (upload direction)
// This requires implementing HWFramesContext API to allocate hardware frames
// with hw_frames_ctx set, which will be added in a future update.
