const test = require('brittle')
const ffmpeg = require('.')

test.solo('dictionary', (t) => {
  const dict = new ffmpeg.Dictionary()

  dict.set('foo', 'bar')

  t.alike(dict.get('foo'), 'bar');
})

test('decode .heic', (t) => {
  const image = require('./test/fixtures/image/sample.heic', {
    with: { type: 'binary' }
  })

  const decoded = decodeImage(image)

  t.comment('width', decoded.width)
  t.comment('height', decoded.height)
  t.comment('data', decoded.data)
})

test('decode .avif', (t) => {
  const image = require('./test/fixtures/image/sample.avif', {
    with: { type: 'binary' }
  })

  const decoded = decodeImage(image)

  t.comment('width', decoded.width)
  t.comment('height', decoded.height)
  t.comment('data', decoded.data)
})

test('decode .jpeg', (t) => {
  const image = require('./test/fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })

  const decoded = decodeImage(image)

  t.comment('width', decoded.width)
  t.comment('height', decoded.height)
  t.comment('data', decoded.data)
})

test('decode .aiff', (t) => {
  const audio = require('./test/fixtures/audio/sample.aiff', {
    with: { type: 'binary' }
  })

  const decoded = decodeAudio(audio)

  t.comment('hz', decoded.hx)
  t.comment('bits', decoded.bits)
  t.comment('data', decoded.data)
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
  io.destroy()

  return result
}

function decodeAudio(audio) {
  const io = new ffmpeg.IOContext(audio)
  const format = new ffmpeg.InputFormatContext(io)

  let result

  for (const stream of format.streams) {
    const packet = new ffmpeg.Packet()
    const frame = new ffmpeg.Frame()

    const decoder = stream.decoder()

    const buffers = []

    while (format.readFrame(packet)) {
      decoder.sendPacket(packet)

      while (decoder.receiveFrame(frame)) {
        buffers.push(frame.channel(0))
      }

      packet.unref()
    }

    packet.destroy()
    frame.destroy()
    decoder.destroy()

    result = {
      hz: stream.codecParameters.sampleRate,
      bits: stream.codecParameters.bitsPerCodedSample,
      data: Buffer.concat(buffers)
    }
  }

  format.destroy()
  io.destroy()

  return result
}
