const test = require('brittle')
const ffmpeg = require('..')

test('resampler converts frames', (t) => {
  using resampler = new ffmpeg.Resampler(
    44100,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  using inputFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const outputSamples = Math.ceil((1024 * 48000) / 44100)
  using outputFrame = createAudioFrame(
    outputSamples,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const converted = resampler.convert(inputFrame, outputFrame)
  t.ok(converted >= 0, 'conversion returns non-negative sample count')
  t.ok(converted <= outputSamples, 'conversion fits in output buffer')
})

test('resampler getOutSamples counts samples buffered from previous calls', (t) => {
  using resampler = new ffmpeg.Resampler(
    44100,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  using inputFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  // A smaller output frame leaves samples buffered in the resampler
  using smallFrame = createAudioFrame(
    960,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )
  t.is(resampler.convert(inputFrame, smallFrame), 960)

  t.ok(resampler.getOutSamples(1024) > Math.ceil((1024 * 48000) / 44100))
})

test('resampler getOutSamples is enough for the next convert', (t) => {
  using resampler = new ffmpeg.Resampler(
    44100,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  using inputFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  // A smaller output frame leaves samples buffered in the resampler
  using smallFrame = createAudioFrame(
    960,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )
  t.is(resampler.convert(inputFrame, smallFrame), 960)

  using outputFrame = createAudioFrame(
    resampler.getOutSamples(1024),
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  t.ok(resampler.convert(inputFrame, outputFrame) <= outputFrame.nbSamples)
})

test('resampler getOutSamples at the same rate', (t) => {
  using resampler = new ffmpeg.Resampler(
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  t.is(resampler.getOutSamples(960), 960)
})

test('resampler converts audio data', (t) => {
  const inputRate = 44100
  const outputRate = 48000
  using resampler = new ffmpeg.Resampler(
    inputRate,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    outputRate,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const inputSamples = 1024
  using inputFrame = createAudioFrame(
    inputSamples,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  using outputFrame = createAudioFrame(
    inputSamples * 2,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const converted = resampler.convert(inputFrame, outputFrame)

  t.ok(converted > 0, 'converted some samples')
  const expectedRatio = outputRate / inputRate
  t.ok(
    Math.abs(converted / inputSamples - expectedRatio) < 0.1,
    'conversion ratio is approximately correct'
  )

  const flushOutput = createAudioFrame(
    100,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const flushed = resampler.flush(flushOutput)
  t.ok(flushed >= 0, 'flush does not error')

  flushOutput.destroy()
})

test('resampler can flush remaining samples', (t) => {
  using resampler = new ffmpeg.Resampler(
    44100,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  using inputFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  using outputFrame = createAudioFrame(
    2048,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  resampler.convert(inputFrame, outputFrame)

  const flushed = resampler.flush(outputFrame)
  t.ok(flushed >= 0, 'flush returns non-negative sample count')
})

test('resampler with audio from aiff file', (t) => {
  const audio = require('./fixtures/audio/sample.aiff', {
    with: { type: 'binary' }
  })
  using io = new ffmpeg.IOContext(audio)
  using format = new ffmpeg.InputFormatContext(io)

  for (const stream of format.streams) {
    const decoder = stream.decoder()
    const packet = new ffmpeg.Packet()
    const inputFrame = new ffmpeg.Frame()

    const resampler = new ffmpeg.Resampler(
      stream.codecParameters.sampleRate,
      stream.codecParameters.channelLayout,
      stream.codecParameters.format,
      48000,
      ffmpeg.constants.channelLayouts.STEREO,
      ffmpeg.constants.sampleFormats.FLTP
    )

    const outputFrame = createAudioFrame(
      2048,
      ffmpeg.constants.channelLayouts.STEREO,
      ffmpeg.constants.sampleFormats.FLTP
    )

    decoder.open()

    if (format.readFrame(packet)) {
      decoder.sendPacket(packet)

      if (decoder.receiveFrame(inputFrame)) {
        const converted = resampler.convert(inputFrame, outputFrame)
        t.is(converted, 2048, 'converted samples from audio file')
      }
    }

    packet.destroy()
    inputFrame.destroy()
    outputFrame.destroy()
    decoder.destroy()
    resampler.destroy()
  }
})

test('resampler converts between different sample formats', (t) => {
  const audio = require('./fixtures/audio/sample.aiff', {
    with: { type: 'binary' }
  })

  using io = new ffmpeg.IOContext(audio)
  using format = new ffmpeg.InputFormatContext(io)
  const stream = format.streams[0]
  using decoder = stream.decoder()

  using resampler = new ffmpeg.Resampler(
    stream.codecParameters.sampleRate,
    stream.codecParameters.channelLayout,
    stream.codecParameters.format,
    stream.codecParameters.sampleRate,
    stream.codecParameters.channelLayout,
    ffmpeg.constants.sampleFormats.FLTP
  )

  using packet = new ffmpeg.Packet()
  using inputFrame = new ffmpeg.Frame()

  decoder.open()

  if (format.readFrame(packet)) {
    decoder.sendPacket(packet)

    if (decoder.receiveFrame(inputFrame)) {
      using outputFrame = new ffmpeg.Frame()
      outputFrame.format = ffmpeg.constants.sampleFormats.FLTP
      outputFrame.nbSamples = inputFrame.nbSamples
      outputFrame.channelLayout = inputFrame.channelLayout
      outputFrame.alloc()

      const converted = resampler.convert(inputFrame, outputFrame)
      t.is(converted, inputFrame.nbSamples, 'converted all samples')
    }
  }
})

test('resampler converts planar audio with more than eight channels', (t) => {
  using resampler = new ffmpeg.Resampler(
    48000,
    0xffff,
    ffmpeg.constants.sampleFormats.FLTP,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.FLTP
  )

  using inputFrame = createAudioFrame(1024, 0xffff, ffmpeg.constants.sampleFormats.FLTP)
  using outputFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.FLTP
  )

  t.ok(resampler.convert(inputFrame, outputFrame) >= 0)
  t.ok(resampler.flush(outputFrame) >= 0)
})

test('resampler rejects input frames that do not match its configuration', (t) => {
  using resampler = new ffmpeg.Resampler(
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  using monoFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.MONO,
    ffmpeg.constants.sampleFormats.S16
  )
  using floatFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.FLTP
  )
  using outputFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  t.exception(() => resampler.convert(monoFrame, outputFrame))
  t.exception(() => resampler.convert(floatFrame, outputFrame))
  t.exception(() => resampler.convert(outputFrame, monoFrame))
  t.exception(() => resampler.flush(monoFrame))
})

test('resampler accepts sample format strings', (t) => {
  using resampler = new ffmpeg.Resampler(48000, 'STEREO', 'S16', 48000, 'STEREO', 'FLT')

  using inputFrame = createAudioFrame(
    4,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )
  const input = new ffmpeg.Samples()
  input.fill(inputFrame)
  new Int16Array(input.data.buffer, input.data.byteOffset, 8).fill(16384)

  using outputFrame = createAudioFrame(
    4,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.FLT
  )

  t.is(resampler.convert(inputFrame, outputFrame), 4)

  const output = new ffmpeg.Samples()
  output.read(outputFrame)
  t.is(new Float32Array(output.data.buffer, output.data.byteOffset, 8)[0], 0.5)
})

test('resampler throws on unknown sample format strings', (t) => {
  t.exception(
    () => new ffmpeg.Resampler(48000, 'STEREO', 'NOPE', 48000, 'STEREO', 'FLT'),
    /UNKNOWN_SAMPLE_FORMAT/
  )
})

function createAudioFrame(samples, channelLayout, format, autosize = null) {
  const frame = new ffmpeg.Frame()

  if (autosize) {
    samples = Math.ceil(samples * autosize.inputRate) / autosize.outputRate
  }

  frame.nbSamples = samples
  frame.format = format
  frame.channelLayout = channelLayout
  frame.alloc()
  return frame
}
