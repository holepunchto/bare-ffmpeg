const test = require('brittle')
const ffmpeg = require('..')
const constants = require('../lib/constants')

const shouldTestSnapshot = Bare.platform === 'darwin' && Bare.arch === 'arm64'

test('decode .heic', (t) => {
  const image = require('./fixtures/image/sample.heic', {
    with: { type: 'binary' }
  })

  const decoded = decodeImage(image)

  t.is(decoded.width, 332)
  t.is(decoded.height, 332)

  if (shouldTestSnapshot) t.snapshot(decoded.data)
})

test('decode .avif', (t) => {
  const image = require('./fixtures/image/sample.avif', {
    with: { type: 'binary' }
  })

  const decoded = decodeImage(image)

  t.is(decoded.width, 332)
  t.is(decoded.height, 332)

  if (shouldTestSnapshot) t.snapshot(decoded.data)
})

test('decode .jpeg', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })

  const decoded = decodeImage(image)

  t.is(decoded.width, 332)
  t.is(decoded.height, 332)

  if (shouldTestSnapshot) t.snapshot(decoded.data)
})

test('decode .aiff', (t) => {
  const audio = require('./fixtures/audio/sample.aiff', {
    with: { type: 'binary' }
  })

  const decoded = decodeAudio(audio)

  t.is(decoded.hz, 8000)
  t.is(decoded.channels, 2)
  t.is(decoded.format, 'S16')

  if (shouldTestSnapshot) t.snapshot(decoded.data)
})

test('decode .mp3', (t) => {
  const audio = require('./fixtures/audio/sample.mp3', {
    with: { type: 'binary' }
  })

  const decoded = decodeAudio(audio)

  t.is(decoded.hz, 44100)
  t.is(decoded.channels, 2)
  t.is(decoded.format, 'S16')

  if (shouldTestSnapshot) t.snapshot(decoded.data)
})

test('decode .mp4', (t) => {
  const video = require('./fixtures/video/sample.mp4', {
    with: { type: 'binary' }
  })

  const decoded = decodeVideo(video)

  if (shouldTestSnapshot) t.snapshot(decoded.video, 'video snapshot')
  if (shouldTestSnapshot) t.snapshot(decoded.audio, 'audio snapshot')
})

test('decode .webm', (t) => {
  const video = require('./fixtures/video/sample.webm', {
    with: { type: 'binary' }
  })

  const decoded = decodeVideo(video)

  if (shouldTestSnapshot) t.snapshot(decoded.video, 'video snapshot')
  if (shouldTestSnapshot) t.snapshot(decoded.audio, 'audio snapshot')
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

    using resampler = new ffmpeg.Resampler(
      stream.codecParameters.sampleRate,
      stream.codecParameters.channelLayout,
      stream.codecParameters.format,
      stream.codecParameters.sampleRate,
      ffmpeg.constants.channelLayouts.STEREO,
      ffmpeg.constants.sampleFormats.S16
    )

    using decoder = stream.decoder()
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
      output.channelLayout.nbChannels,
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

function decodeVideo(video) {
  const io = new ffmpeg.IOContext(video)
  using format = new ffmpeg.InputFormatContext(io)

  using packet = new ffmpeg.Packet()
  const frame = new ffmpeg.Frame()

  const streams = []

  for (const stream of format.streams) {
    if (
      stream.codecParameters.codecType !== constants.mediaTypes.VIDEO &&
      stream.codecParameters.codecType !== constants.mediaTypes.AUDIO
    ) {
      continue
    }

    streams[stream.index] = { stream, decoder: stream.decoder() }
  }

  const result = { video: [], audio: [] }

  while (format.readFrame(packet)) {
    const { stream, decoder } = streams[packet.streamIndex]

    decoder.sendPacket(packet)

    while (decoder.receiveFrame(frame)) {}

    if (stream.codecParameters.codecType === constants.mediaTypes.VIDEO) {
      result.video.push(packet.data)
    } else {
      result.audio.push(packet.data)
    }

    packet.unref()
  }

  for (const { decoder } of streams) decoder.destroy()

  result.video = Buffer.concat(result.video)
  result.audio = Buffer.concat(result.audio)

  return result
}
