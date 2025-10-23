const ffmpeg = require('..')
const assert = require('bare-assert')
const fs = require('bare-fs')

console.log('Generating sine wave audio...')

// Create sine wave input (3 second, 440Hz tone)
const inputFormat = createSineWaveInput(3, {
  frequency: 440,
  sampleRate: 48000,
  sampleFormat: 's16'
})

// Get audio stream from the inputFormat
const inputStream = inputFormat.getBestStream(ffmpeg.constants.mediaTypes.AUDIO)

// Create WebM output in memory (Opus audio in WebM container)
const audioChunks = []
const audioIO = new ffmpeg.IOContext(Buffer.alloc(4096), {
  onwrite: (chunk) => audioChunks.push(chunk)
})
const outputFormat = new ffmpeg.OutputFormatContext('webm', audioIO)

// Set up output stream
const outputStream = outputFormat.createStream()
outputStream.codecParameters.type = ffmpeg.constants.mediaTypes.AUDIO
outputStream.codecParameters.id = ffmpeg.constants.codecs.OPUS // Use Opus codec
outputStream.codecParameters.sampleRate = inputStream.codecParameters.sampleRate
outputStream.codecParameters.channelLayout =
  inputStream.codecParameters.channelLayout
outputStream.codecParameters.format = ffmpeg.constants.sampleFormats.FLTP // Opus requires FLTP
outputStream.timeBase = inputStream.timeBase

// Create decoder and encoder
const decoder = inputStream.decoder()
const encoder = outputStream.encoder()

// Create resampler to convert S16 → FLTP for Opus encoder
const resampler = new ffmpeg.Resampler(
  inputStream.codecParameters.sampleRate,
  inputStream.codecParameters.channelLayout,
  inputStream.codecParameters.format, // S16 input
  outputStream.codecParameters.sampleRate,
  outputStream.codecParameters.channelLayout,
  outputStream.codecParameters.format // FLTP output
)

outputFormat.writeHeader()

// Process audio frames
const packet = new ffmpeg.Packet()
const frame = new ffmpeg.Frame()
const resampledFrame = new ffmpeg.Frame()
const outputPacket = new ffmpeg.Packet()
let frameCount = 0

// Allocate resampled frame (Opus requires 960 samples per frame)
resampledFrame.format = outputStream.codecParameters.format
resampledFrame.channelLayout = outputStream.codecParameters.channelLayout
resampledFrame.nbSamples = 960 // Opus frame size
resampledFrame.alloc()

while (inputFormat.readFrame(packet)) {
  if (packet.streamIndex !== inputStream.index) continue

  // Decode input packet
  const status = decoder.sendPacket(packet)
  if (!status) throw new Error('Failed to decode packet')

  // Process decoded frames
  while (decoder.receiveFrame(frame)) {
    frameCount++

    // Resample S16 → FLTP
    const samplesConverted = resampler.convert(frame, resampledFrame)
    resampledFrame.nbSamples = samplesConverted
    resampledFrame.copyProperties(frame)

    // Encode frame to output
    const hasCapacity = encoder.sendFrame(resampledFrame)
    if (!hasCapacity) throw new Error('Encoder full')

    // Write encoded packets
    while (encoder.receivePacket(outputPacket)) {
      outputPacket.streamIndex = outputStream.index
      outputFormat.writeFrame(outputPacket)
      outputPacket.unref()
    }
  }

  packet.unref()
}

// Flush encoder
encoder.sendFrame(null)
while (encoder.receivePacket(outputPacket)) {
  outputPacket.streamIndex = outputStream.index
  outputFormat.writeFrame(outputPacket)
  outputPacket.unref()
}

outputFormat.writeTrailer()

// Clean up
inputFormat.destroy()
outputFormat.destroy()
decoder.destroy()
encoder.destroy()
resampler.destroy()
frame.destroy()
resampledFrame.destroy()

// Validate the generated WebM data
const audioData = Buffer.concat(audioChunks)

console.log('✓ Sine wave audio generated successfully!')
console.log(`Processed ${frameCount} audio frames`)
console.log(`Generated WebM file size: ${audioData.length} bytes`)

// Write the file to disk
const filename = 'sine_wave_440hz.webm'
fs.writeFileSync(filename, audioData)

console.log(`✓ Audio file saved as ${filename}`)
console.log(
  'You can now play this file with any media player that supports WebM/Opus!'
)
console.log(`Example: vlc ${filename} or ffplay ${filename}`)

function createSineWaveInput(duration = 3, opts = {}) {
  const sampleRate = opts.sampleRate || 48000
  const sampleFormat = opts.sampleFormat || 's16'
  const frequency = opts.frequency || 440
  const frameSize = opts.frameSize || 1024

  const options = new ffmpeg.Dictionary()

  const graph = `
    sine=frequency=${frequency}:
      sample_rate=${sampleRate}:
      duration=${duration},
      asetnsamples=n=${frameSize},
      aformat=sample_fmts=${sampleFormat}[out0]
  `.replace(/\s+/g, '')

  options.set('graph', graph)

  const format = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options
  )

  return format
}
