const ffmpeg = require('..')
const assert = require('bare-assert')

// Generate a sine wave and encode it to WebM format (Opus audio)
function main() {
  console.log('Generating sine wave audio...')

  // Create sine wave input (1 second, 440Hz tone)
  const inputFormat = createSineWaveInput(1000, {
    frequency: 440,
    sampleRate: 48000,
    sampleFormat: 's16'
  })

  // Create WebM output in memory (Opus audio in WebM container)
  const audioChunks = []
  const audioIO = new ffmpeg.IOContext(Buffer.alloc(4096), {
    onwrite: (chunk) => audioChunks.push(chunk)
  })
  const outputFormat = new ffmpeg.OutputFormatContext('webm', audioIO)

  // Set up output stream
  const inputStream = inputFormat.getBestStream(
    ffmpeg.constants.mediaTypes.AUDIO
  )
  const outputStream = outputFormat.createStream()

  // Set up codec parameters for WebM output
  outputStream.codecParameters.type = ffmpeg.constants.mediaTypes.AUDIO
  outputStream.codecParameters.id = ffmpeg.constants.codecs.OPUS // Use Opus codec
  outputStream.codecParameters.sampleRate =
    inputStream.codecParameters.sampleRate
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
    packet.unref()

    // Process decoded frames
    while (decoder.receiveFrame(frame)) {
      frameCount++

      // Resample S16 → FLTP
      const samplesConverted = resampler.convert(frame, resampledFrame)
      resampledFrame.nbSamples = samplesConverted

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

  // Basic WebM file validation
  assert(
    audioData.length > 32,
    'WebM file should be larger than minimal header'
  )
  // WebM files start with EBML header
  assert(
    audioData[0] === 0x1a &&
      audioData[1] === 0x45 &&
      audioData[2] === 0xdf &&
      audioData[3] === 0xa3,
    'Should have EBML header'
  )

  console.log('✓ WebM file format validation passed!')
  console.log(
    'Note: In a real application, you would save this Buffer to a .webm file'
  )
}

function createSineWaveInput(duration = 1000, opts = {}) {
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

// Run the example
main()
