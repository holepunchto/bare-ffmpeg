const test = require('brittle')
const ffmpeg = require('..')

test('write webm', async (t) => {
  const { defer, clean } = usingWorkaround()

  // input

  const inFormat = avsynctestInput()
  defer(inFormat)

  const inputStream = inFormat.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
  t.alike(inputStream.timeBase, new ffmpeg.Rational(1, 60))

  const { width, height } = inputStream.codecParameters

  t.is(width, 1280)
  t.is(height, 720)

  const decoder = inputStream.decoder()
  defer(decoder)

  decoder.timeBase = inputStream.timeBase // TODO: remove after PR#57 merge
  t.alike(decoder.timeBase, inputStream.timeBase, 'decoder.timebase')

  t.is(decoder.pixelFormat, ffmpeg.constants.pixelFormats.YUV420P)

  // encoder

  const encoder = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  defer(encoder)

  encoder.width = width
  encoder.height = height
  encoder.pixelFormat = decoder.pixelFormat
  encoder.timeBase = decoder.timeBase

  encoder.open()

  // output

  const onwrite = buffer => {
    console.log('on write', buffer.byteLength)
  }
  const io = new ffmpeg.IOContext(Buffer.alloc(4096), onwrite)
  defer(io)

  const format = new ffmpeg.OutputFormatContext(
    new ffmpeg.OutputFormat('webm'),
    io
  )
  defer(format)

  const outputStream = format.createStream()

  // configure output stream to match encoder
  outputStream.codecParameters.fromContext(encoder)
  outputStream.timeBase = inputStream.timeBase
  outputStream.id = 1911 // defined by user or arbitrary format spec

  // assert props
  t.is(outputStream.id, 1911, 'id')
  t.is(outputStream.index, 0, 'stream index')
  t.alike(outputStream.timeBase, inputStream.timeBase, 'framerate')
  t.is(outputStream.codec, ffmpeg.Codec.AV1, 'codec set')

  // assert param's props
  t.is(outputStream.codecParameters.codecType, ffmpeg.constants.mediaTypes.VIDEO, 'media type')
  t.is(outputStream.codecParameters.codecId, ffmpeg.Codec.AV1.id, 'codec')
  t.is(outputStream.codecParameters.width, width, 'width')
  t.is(outputStream.codecParameters.height, height, 'height')

  // transcode
  const frame = new ffmpeg.Frame()
  const packet = new ffmpeg.Packet()

  format.writeHeader()

  const captured = 0
  while (captured < 120) {
    const status = inFormat.readFrame(packet)
    if (!status) throw new Error('failed capturing frame')

    console.log(packet)

    decoder.sendPacket(packet)
    packet.unref()

    captured++
  }

  while (decoder.receiveFrame(frame)) {
    encoder.sendFrame(frame)
  }

  while (encoder.receivePacket(packet)) {
    format.writePacket(packet)
    packet.unref()
  }

  format.writeEnd()

  await clean()
})

function avsynctestInput () {
  const options = new ffmpeg.Dictionary()
  options.set('graph', 'avsynctest=size=hd720:framerate=60:period=1:samplerate=48000:amplitude=0.4[out0][out1]')

  const format = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options
  )

  return format
}

// keyword 'using' breaks eslint & breaks error reporting
function usingWorkaround () {
  const resources = []
  return {
    defer (r) {
      if (typeof (r[Symbol.asyncDispose] || r[Symbol.dispose]) !== 'function') throw new Error('not a resource')
      resources.push(r)
    },

    async clean () {
      for (const r of resources) {
        try {
          await (r[Symbol.asyncDispose] || r[Symbol.dispose]).apply(r)
        } catch (error) {
          console.log('resource dispose failed for', r)
          throw error
        }
      }
    }
  }
}
