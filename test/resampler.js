const test = require('brittle')
const ffmpeg = require('..')

test('resampler converts frames', (t) => {
  const resampler = new ffmpeg.Resampler(
    44100,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const inputFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const outputSamples = Math.ceil((1024 * 48000) / 44100)
  const outputFrame = createAudioFrame(
    outputSamples,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  t.teardown(() => {
    inputFrame.destroy()
    outputFrame.destroy()
    resampler.destroy()
  })

  const converted = resampler.convert(inputFrame, outputFrame)
  t.ok(converted >= 0, 'conversion returns non-negative sample count')
  t.ok(converted <= outputSamples, 'conversion fits in output buffer')
})

test('resampler modifies audio data', (t) => {
  const resampler = new ffmpeg.Resampler(
    44100,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const inputFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const outputFrame = createAudioFrame(
    1200,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  t.teardown(() => {
    inputFrame.destroy()
    outputFrame.destroy()
    resampler.destroy()
  })

  const inputData = inputFrame.audioChannel()
  for (let i = 0; i < inputData.length; i += 2) {
    inputData.writeInt16LE(1000, i)
  }

  const converted = resampler.convert(inputFrame, outputFrame)
  t.ok(converted > 1000, 'converted a reasonable number of samples')

  const outputData = outputFrame.audioChannel()
  let foundNonZero = false

  for (let i = 0; i < converted * 4; i += 2) {
    // skip what i guess is padding? the first couple chunks are 0
    if (outputData.readInt16LE(i) !== 0) {
      foundNonZero = true
      break
    }
  }

  t.ok(foundNonZero, 'output contains audio data')
})

test('resampler can flush remaining samples', (t) => {
  const resampler = new ffmpeg.Resampler(
    44100,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16,
    48000,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const inputFrame = createAudioFrame(
    1024,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  const outputFrame = createAudioFrame(
    2048,
    ffmpeg.constants.channelLayouts.STEREO,
    ffmpeg.constants.sampleFormats.S16
  )

  t.teardown(() => {
    inputFrame.destroy()
    outputFrame.destroy()
    resampler.destroy()
  })

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
  io.destroy()
})

test('resampler converts between different sample formats', (t) => {
  const audio = require('./fixtures/audio/sample.aiff', {
    with: { type: 'binary' }
  })

  const io = new ffmpeg.IOContext(audio)
  const format = new ffmpeg.InputFormatContext(io)
  const stream = format.streams[0]
  const decoder = stream.decoder()

  const resampler = new ffmpeg.Resampler(
    stream.codecParameters.sampleRate,
    ffmpeg.constants.channelLayouts.MONO,
    ffmpeg.constants.sampleFormats.S16,
    stream.codecParameters.sampleRate,
    ffmpeg.constants.channelLayouts.MONO,
    ffmpeg.constants.sampleFormats.FLTP
  )

  t.teardown(() => {
    stream.destroy()
    decoder.destroy()
    resampler.destroy()
  })

  const packet = new ffmpeg.Packet()
  const inputFrame = new ffmpeg.Frame()

  if (format.readFrame(packet)) {
    decoder.sendPacket(packet)

    if (decoder.receiveFrame(inputFrame)) {
      const outputFrame = new ffmpeg.Frame()
      outputFrame.format = ffmpeg.constants.sampleFormats.FLTP
      outputFrame.nbSamples = inputFrame.nbSamples
      outputFrame.channelLayout =
        inputFrame.channelLayout || ffmpeg.constants.channelLayouts.MONO
      outputFrame.alloc()

      const converted = resampler.convert(inputFrame, outputFrame)
      t.is(converted, inputFrame.nbSamples, 'converted all samples')

      const leftChannel = outputFrame.audioChannel()
      t.ok(leftChannel.length > 0, 'output channel has data')

      outputFrame.destroy()
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
