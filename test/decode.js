const test = require('brittle')
const ffmpeg = require('..')

test('decode .heic', (t) => {
  const image = require('./fixtures/image/sample.heic', {
    with: { type: 'binary' }
  })

  const decoded = decodeImage(image)

  t.comment('width', decoded.width)
  t.comment('height', decoded.height)
  t.comment('data', decoded.data)
})

test('decode .avif', (t) => {
  const image = require('./fixtures/image/sample.avif', {
    with: { type: 'binary' }
  })

  const decoded = decodeImage(image)

  t.comment('width', decoded.width)
  t.comment('height', decoded.height)
  t.comment('data', decoded.data)
})

test('decode .jpeg', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })

  const decoded = decodeImage(image)

  t.comment('width', decoded.width)
  t.comment('height', decoded.height)
  t.comment('data', decoded.data)
})

test.skip('decode .aiff', (t) => {
  const audio = require('./fixtures/audio/sample.aiff', {
    with: { type: 'binary' }
  })

  const decoded = decodeAudio(audio)

  t.comment('hz', decoded.hz)
  t.comment('channels', decoded.channels)
  t.comment('format', decoded.format)
  t.comment('data', decoded.data)
})

test('decode .mp3', (t) => {
  const audio = require('./fixtures/audio/sample.mp3', {
    with: { type: 'binary' }
  })

  const decoded = decodeAudio(audio)

  t.comment('hz', decoded.hz)
  t.comment('channels', decoded.channels)
  t.comment('format', decoded.format)
  t.comment('data', decoded.data)
})

function decodeImage(image) {
  const io = new ffmpeg.IOContext(image)
  using format = new ffmpeg.InputFormatContext(io)

  let result

  for (const stream of format.streams) {
    using packet = new ffmpeg.Packet()
    format.readFrame(packet)

    using raw = new ffmpeg.Frame()
    using rgba = new ffmpeg.Frame()

    using decoder = stream.decoder()
    decoder.sendPacket(packet)
    decoder.receiveFrame(raw)

    result = new ffmpeg.Image('RGBA', decoder.width, decoder.height)
    result.fill(rgba)

    using scaler = new ffmpeg.Scaler(
      decoder.pixelFormat,
      decoder.width,
      decoder.height,
      result.pixelFormat,
      result.width,
      result.height
    )

    scaler.scale(raw, rgba)
  }

  return result
}

function decodeAudio(audio) {
  const io = new ffmpeg.IOContext(audio)
  using format = new ffmpeg.InputFormatContext(io)

  let result

  for (const stream of format.streams) {
    using packet = new ffmpeg.Packet()
    using raw = new ffmpeg.Frame()

    using decoder = stream.decoder()

    using resampler = new ffmpeg.Resampler(
      stream.codecParameters.sampleRate,
      stream.codecParameters.channelLayout,
      decoder.sampleFormat,
      stream.codecParameters.sampleRate,
      ffmpeg.constants.channelLayouts.STEREO,
      ffmpeg.constants.sampleFormats.S16
    )

    const buffers = []

    while (format.readFrame(packet)) {
      decoder.sendPacket(packet)

      while (decoder.receiveFrame(raw)) {
        using output = new ffmpeg.Frame()
        output.channelLayout = ffmpeg.constants.channelLayouts.STEREO
        output.format = ffmpeg.constants.sampleFormats.S16
        output.nbSamples = raw.nbSamples
        output.sampleRate = stream.codecParameters.sampleRate

        const samples = new ffmpeg.Samples('S16', 2, output.nbSamples)
        samples.fill(output)

        resampler.convert(raw, output)
        buffers.push(Buffer.from(samples.data))
      }

      packet.unref()
    }

    using output = new ffmpeg.Frame()
    output.channelLayout = ffmpeg.constants.channelLayouts.STEREO
    output.format = ffmpeg.constants.sampleFormats.S16
    output.nbSamples = 1024

    const samples = new ffmpeg.Samples(
      output.format,
      output.channelLayout,
      output.nbSamples
    )
    samples.fill(output)

    while (resampler.flush(output) > 0) {
      buffers.push(Buffer.from(samples.data))
    }

    result = {
      hz: stream.codecParameters.sampleRate,
      channels: stream.codecParameters.nbChannels,
      format: 'S16',
      data: Buffer.concat(buffers)
    }
  }

  return result
}
