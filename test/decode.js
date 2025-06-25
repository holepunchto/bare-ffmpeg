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

test('decode .mp3', (t) => {
  const audio = require('./fixtures/audio/sample.mp3', {
    with: { type: 'binary' }
  })

  const decoded = decodeAudio(audio)

  t.comment('hz', decoded.hz)
  t.comment('channels', decoded.channels)
  t.comment('format', decoded.format)
  t.comment('data length', decoded.data.length)
})

function decodeImage(image) {
  const io = new ffmpeg.IOContext(image)
  const format = new ffmpeg.InputFormatContext(io)

  let result

  for (const stream of format.streams) {
    const packet = new ffmpeg.Packet()
    format.readFrame(packet)

    const raw = new ffmpeg.Frame()
    const rgba = new ffmpeg.Frame()

    const decoder = stream.decoder()
    decoder.sendPacket(packet)
    decoder.receiveFrame(raw)

    result = new ffmpeg.Image('RGBA', decoder.width, decoder.height)
    result.fill(rgba)

    const scaler = new ffmpeg.Scaler(
      decoder.pixelFormat,
      decoder.width,
      decoder.height,
      result.pixelFormat,
      result.width,
      result.height
    )

    scaler.scale(raw, rgba)
    scaler.destroy()

    packet.unref()
    packet.destroy()
    raw.destroy()
    rgba.destroy()
    decoder.destroy()
  }

  format.destroy()

  return result
}

function decodeAudio(encoded) {
  const io = new ffmpeg.IOContext(encoded)
  const format = new ffmpeg.InputFormatContext(io)

  let result

  for (const stream of format.streams) {
    const packet = new ffmpeg.Packet()
    const raw = new ffmpeg.Frame()
    const decoder = stream.decoder()

    const resampler = new ffmpeg.Resampler(
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
        const output = new ffmpeg.Frame()
        output.channelLayout = ffmpeg.constants.channelLayouts.STEREO
        output.format = ffmpeg.constants.sampleFormats.S16
        output.nbSamples = raw.nbSamples
        output.sampleRate = stream.codecParameters.sampleRate

        const audio = new ffmpeg.Audio('S16', 2, output.nbSamples)
        audio.fill(output)

        resampler.convert(raw, output)
        buffers.push(Buffer.from(output.audioChannel()))
        output.destroy()
      }

      packet.unref()
    }

    let output = new ffmpeg.Frame()
    output.channelLayout = ffmpeg.constants.channelLayouts.STEREO
    output.format = ffmpeg.constants.sampleFormats.S16
    output.nbSamples = 1024

    const audio = new ffmpeg.Audio(
      output.format,
      output.channelLayout,
      output.nbSamples
    )
    audio.fill(output)

    while (resampler.flush(output) > 0) {
      buffers.push(Buffer.from(output.audioChannel()))
    }

    output.destroy()
    packet.destroy()
    raw.destroy()
    decoder.destroy()
    resampler.destroy()

    result = {
      hz: stream.codecParameters.sampleRate,
      channels: stream.codecParameters.channels,
      format: 'S16',
      data: Buffer.concat(buffers)
    }
  }

  format.destroy()

  return result
}
