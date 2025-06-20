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

  const buffer = inputFrame.audioChannel()
  for (let i = 0; i < buffer.length; i += 2) {
    buffer.writeInt16LE(1000, i)
  }

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
  const io = new ffmpeg.IOContext(audio)
  const format = new ffmpeg.InputFormatContext(io)

  for (const stream of format.streams) {
    const decoder = stream.decoder()
    const packet = new ffmpeg.Packet()
    const inputFrame = new ffmpeg.Frame()

    const resampler = new ffmpeg.Resampler(
      stream.codecParameters.sampleRate,
      ffmpeg.constants.channelLayouts.MONO,
      ffmpeg.constants.sampleFormats.S16,
      48000,
      ffmpeg.constants.channelLayouts.STEREO,
      ffmpeg.constants.sampleFormats.FLTP
    )

    const outputFrame = createAudioFrame(
      2048,
      ffmpeg.constants.channelLayouts.STEREO,
      ffmpeg.constants.sampleFormats.FLTP
    )

    if (format.readFrame(packet)) {
      decoder.sendPacket(packet)

      if (decoder.receiveFrame(inputFrame)) {
        const converted = resampler.convert(inputFrame, outputFrame)
        t.is(converted, 2048, 'converted samples from audio file')
      }
    }

    inputFrame.destroy()
    outputFrame.destroy()
    decoder.destroy()
    resampler.destroy()
  }

  format.destroy()
})

test('resampler converts between different sample formats', (t) => {
  const audio = require('./fixtures/audio/sample.aiff', {
    with: { type: 'binary' }
  })

  const io = new ffmpeg.IOContext(audio)
  using format = new ffmpeg.InputFormatContext(io)
  const stream = format.streams[0]
  using decoder = stream.decoder()

  using resampler = new ffmpeg.Resampler(
    stream.codecParameters.sampleRate,
    ffmpeg.constants.channelLayouts.MONO,
    ffmpeg.constants.sampleFormats.S16,
    stream.codecParameters.sampleRate,
    ffmpeg.constants.channelLayouts.MONO,
    ffmpeg.constants.sampleFormats.FLTP
  )

  const packet = new ffmpeg.Packet()
  const inputFrame = new ffmpeg.Frame()

  if (format.readFrame(packet)) {
    decoder.sendPacket(packet)

    if (decoder.receiveFrame(inputFrame)) {
      using outputFrame = new ffmpeg.Frame()
      outputFrame.format = ffmpeg.constants.sampleFormats.FLTP
      outputFrame.nbSamples = inputFrame.nbSamples
      outputFrame.channelLayout =
        inputFrame.channelLayout || ffmpeg.constants.channelLayouts.MONO
      outputFrame.alloc()

      const converted = resampler.convert(inputFrame, outputFrame)
      t.is(converted, inputFrame.nbSamples, 'converted all samples')
    }
  }
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
