const test = require('brittle')
const ffmpeg = require('..')

const { logLevels, codecFlags, formatFlags } = ffmpeg.constants
ffmpeg.logLevel = logLevels.TRACE

test('write webm', async (t) => {
  const FRAMERATE = 60
  const { defer, clean } = usingDefer()

  // input

  const inFormat = avsynctestInput()
  defer(inFormat)

  const inputStream = inFormat.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
  if (!inputStream) throw new Error('getStream failed')

  t.alike(inputStream.timeBase, new ffmpeg.Rational(1, FRAMERATE))

  const videoIdx = inputStream.index
  t.is(videoIdx, 1, 'video stream index')

  const { width, height } = inputStream.codecParameters
  t.is(width, 1280)
  t.is(height, 720)

  const decoder = inputStream.decoder()
  defer(decoder)

  decoder.timeBase = inputStream.timeBase // TODO: remove after PR#57 merge
  t.alike(decoder.timeBase, inputStream.timeBase, 'decoder.timebase')

  t.is(decoder.pixelFormat, ffmpeg.constants.pixelFormats.YUV420P)
  decoder.open()

  // output
  const fileStream = require('fs').createWriteStream('out_dump.webm')
  const wreqs = []
  const onwrite = buffer => {
    const copy = Buffer.from(buffer).slice() // poor/unsafe interface

    wreqs.push(
      new Promise((resolve, reject) => {
        fileStream.write(copy, err => {
          console.log('written', copy.byteLength, err)
          if (err) reject(err)
          else resolve()
        })
      })
    )
  }

  const io = new ffmpeg.IOContext(4096, onwrite)
  defer(io)

  const fmt = new ffmpeg.OutputFormat('webm')
  const outContext = new ffmpeg.OutputFormatContext(fmt, io)
  defer(outContext)

  const outputStream = outContext.createStream()

  // encoder

  const encoder = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  defer(encoder)

  encoder.width = width
  encoder.height = height
  encoder.pixelFormat = decoder.pixelFormat
  encoder.timeBase = inputStream.timeBase

  if (fmt.flags & formatFlags.GLOBALHEADER) {
    encoder.flags |= codecFlags.GLOBAL_HEADER
  }

  encoder.open()

  // configure output stream to match encoder
  outputStream.codecParameters.fromContext(encoder)

  outputStream.timeBase = inputStream.timeBase
  outputStream.id = 0 // user defined

  // assert props
  t.is(outputStream.id, 0, 'id')
  t.is(outputStream.index, 0, 'stream index')
  t.alike(outputStream.timeBase, inputStream.timeBase, 'framerate')
  t.is(outputStream.codec, ffmpeg.Codec.AV1, 'codec set')

  // assert param's props
  t.is(outputStream.codecParameters.codecType, ffmpeg.constants.mediaTypes.VIDEO, 'media type')
  t.is(outputStream.codecParameters.codecId, ffmpeg.Codec.AV1.id, 'codec')
  t.is(outputStream.codecParameters.width, width, 'width')
  t.is(outputStream.codecParameters.height, height, 'height')

  outContext.dump(0) // print output format (logLevel.TRACE)

  outContext.writeHeader()

  // transcode
  const frame = new ffmpeg.Frame()
  const packet = new ffmpeg.Packet()

  const n = FRAMERATE * 10

  let captured = 0
  let encoded = 0
  let lastFrame = Date.now()

  while (captured < n) {
    let status = inFormat.readFrame(packet)
    if (!status) throw new Error('failed capturing frame')

    const { streamIndex } = packet

    if (streamIndex === videoIdx) { // process video
      status = decoder.sendPacket(packet)
      if (!status) throw new Error('failed decoding packet')

      packet.unref()

      while (decoder.receiveFrame(frame)) {
        captured++

        const hasCapacity = encoder.sendFrame(frame)
        if (!hasCapacity) throw new Error('encoder full')

        outputEncoded()
      }
    }

    await chillout((1000 / FRAMERATE) - (Date.now() - lastFrame))

    lastFrame = Date.now()
  }

  function outputEncoded() {
    while (encoder.receivePacket(packet)) {
      packet.dump(outputStream)

      outContext.writeFrame(packet)
      packet.unref()

      encoded++
    }
  }

  encoder.sendFrame(null) // end-of-stream

  outputEncoded()

  console.log('writing trailer')
  outContext.writeTrailer()
  console.log('closing filestream')
  await Promise.all(wreqs)
  console.log('all wreqs settled')
  fileStream.destroy()

  console.log(captured, encoded)
  t.is(captured, encoded, 'transcoding complete')

  await clean()
})

function avsynctestInput () {
  const options = new ffmpeg.Dictionary()
  options.set('graph', 'avsynctest=size=hd720:framerate=60:period=1:samplerate=48000:amplitude=0.4[out0][out1]')

  const format = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options
  )

  format.dump()

  return format
}

function chillout (millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

/**
 * TODO: trace brittle resources
 * there are quite a few bare-ffmpeg objects that throw or segfault
 * when destroyed unless fully initialized
 *
 * @param {number} trace - 0: default disabled, 1: detect & throw doublefree , 2: log all dispose calls
 */
function usingDefer (trace = 0) {
  const resources = []
  let cleaning = false

  return {
    defer (r) {
      if (typeof (r[Symbol.asyncDispose] || r[Symbol.dispose]) !== 'function') throw new Error('not a resource')

      resources.push(r)

      if (!trace) return

      // assume strict ownership

      const stack = (new Error()).stack.split('\n').slice(1).join('\n')

      const target = r[Symbol.dispose]
      if (typeof target === 'function') {
        r[Symbol.dispose] = () => {
          if (!cleaning) throw new Error('Double dispose! resource free\'d outside of "clean()"')

          if (trace > 1) {
            console.info('Destroying ', r, ' @ ', stack)
          }

          target.apply(r)
        }
      }

      const targetAsync = r[Symbol.asyncDispose]
      if (typeof targetAsync === 'function') {
        r[Symbol.asyncDispose] = async () => {
          if (!cleaning) throw new Error('Double dispose! resource free\'d outside of "clean()"')

          if (trace > 1) {
            console.info('Destroying ', r, ' @ ', stack)
          }

          return targetAsync.apply(r)
        }
      }
    },

    async clean () {
      console.log('freeing', resources.length, 'resources')
      cleaning = true

      for (const r of resources.reverse()) {
        try {
          await (r[Symbol.asyncDispose] || r[Symbol.dispose]).apply(r)
        } catch (error) {
          console.log('resource dispose failed for', r)
          throw error
        }
      }

      cleaning = false
    }
  }
}
