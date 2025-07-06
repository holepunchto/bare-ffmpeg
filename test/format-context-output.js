const test = require('brittle')
const ffmpeg = require('..')

ffmpeg.logLevel = ffmpeg.constants.logLevels.TRACE

test('write webm', async (t) => {
  const { defer, clean } = usingDefer()

  // input

  const inFormat = avsynctestInput()
  defer(inFormat)

  const inputStream = inFormat.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
  if (!inputStream) throw new Error('getStream failed')

  t.alike(inputStream.timeBase, new ffmpeg.Rational(1, 60))

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

  // encoder

  const encoder = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  defer(encoder)

  encoder.width = width
  encoder.height = height
  encoder.pixelFormat = decoder.pixelFormat
  encoder.timeBase = inputStream.timeBase

  encoder.open()

  // output

  const io = ffmpeg.IOContext.initFileOutput('out.webm')
  defer(io)

  const format = new ffmpeg.OutputFormatContext('webm', io)
  defer(format)

  const outputStream = format.createStream()

  // configure output stream to match encoder
  outputStream.codecParameters.fromContext(encoder)

  outputStream.timeBase = inputStream.timeBase
  outputStream.id = format.streams.length - 1 // 1911 // defined by user or arbitrary format spec

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

  const formatOptions = new ffmpeg.Dictionary()
  defer(formatOptions)

  console.log('=====')
  format.dump(0) // print output format
  console.log('=====')

  format.writeHeader(formatOptions)

  // transcode
  const frame = new ffmpeg.Frame()
  const packet = new ffmpeg.Packet()

  let captured = 0
  let encoded = 0

  while (captured < 120) {
    const status = inFormat.readFrame(packet)
    if (!status) throw new Error('failed capturing frame')

    const { streamIndex } = packet

    if (streamIndex === videoIdx) { // process video
      decoder.sendPacket(packet)
      packet.unref()

      while (decoder.receiveFrame(frame)) {
        encoder.sendFrame(frame)
        captured++

        while (encoder.receivePacket(packet)) {
          // console.log('forwarding encoded packet', packet.streamIndex, encoded, packet.data)

          // breakpoint set --file mux.c --line 1144
          format.writeFrame(packet)
          packet.unref()

          encoded++
        }
      }
    }
  }

  format.writeTrailer()

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

// TODO: trace brittle resources
// there are quite a few bare-ffmpeg objects that throw or segfault
// when destroyed unless fully initialized

/**
 * keyword 'using' introduced by:
 * https://github.com/tc39/proposal-explicit-resource-management
 *
 * Issues:
 * - breaks eslint
 * - breaks error reporting (fixed): https://github.com/holepunchto/bare-inspect/commit/e7b94845a1cb9de82c1fa50a5821cef45c7b279b
 * - introduces ownership
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
