const test = require('brittle')

const ffmpeg = require('..')
/**
 * UPDATE:
 * packet.time_base and frame.time_base are experimental / mostly unused.
 * we can a) Implement timebase converters that take ensure all values are rescaled
 * b) continue to ignore those timebases and use 1 fixed stream_timebase
 *
 * AVInputFormatContext.streams[0].time_base; contains persisted/generated timebase
 * AVCodecContext.pkt_timebase; specifies incoming packet's timebase during decoding
 * AVCodecContext.time_base; specifies incoming packet's timebase during encoding
 */
test('timebase is preserved between operations for video capture', async t => {
  const { defer, clean } = usingWorkaround()

  const FRAMERATE = 30
  const TIMEBASE_MS = new ffmpeg.Rational(1, 1000)
  const OUTPUT_WIDTH = 854
  const OUTPUT_HEIGHT = 480
  const OUTPUT_TIMEBASE = new ffmpeg.Rational(1, FRAMERATE)

  // init input state

  const inputOptions = new ffmpeg.Dictionary()
  // defer(inputOptions) // ownership transferred format context?

  inputOptions.set('framerate', String(FRAMERATE))
  inputOptions.set('video_size', '1920x1080')

  const inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(),
    inputOptions
  )
  defer(inputFormatContext)

  const bestStream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  t.is(bestStream.codecParameters.codecType, ffmpeg.constants.mediaTypes.VIDEO)

  const streamTimeBase = bestStream.timeBase
  t.ok(streamTimeBase, 'stream timebase set')
  t.is(streamTimeBase.numerator, 1)
  t.is(streamTimeBase.denominator, 1000000, 'microsecond captures')

  const rawDecoder = bestStream.decoder()
  rawDecoder.timeBase = streamTimeBase

  t.alike(rawDecoder.timeBase, streamTimeBase)

  const rawFrame = new ffmpeg.Frame() // initialized by decoder
  defer(rawFrame)

  // init encoder state

  const yuvFrame = new ffmpeg.Frame()
  defer(yuvFrame)

  yuvFrame.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  yuvFrame.width = OUTPUT_WIDTH
  yuvFrame.height = OUTPUT_HEIGHT
  yuvFrame.alloc()

  const scaler = new ffmpeg.Scaler(
    rawDecoder.pixelFormat,
    rawDecoder.width,
    rawDecoder.height,
    yuvFrame.pixelFormat,
    yuvFrame.width,
    yuvFrame.height
  )
  defer(scaler)

  const encOptions = new ffmpeg.Dictionary()
  defer(encOptions)
  // options intentionally empty

  const encoder = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  defer(encoder)

  encoder.width = yuvFrame.width
  encoder.height = yuvFrame.height
  encoder.pixelFormat = yuvFrame.pixelFormat
  encoder.timeBase = new ffmpeg.Rational(1, FRAMERATE)
  encoder.open(encOptions)

  // init decoder state

  const decoder = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.decoder)
  defer(decoder)

  const yuvDecoded = new ffmpeg.Frame()
  defer(yuvDecoded)

  // BEGIN ENCODING
  const packet = new ffmpeg.Packet()

  let nTranscoded = 0
  while (nTranscoded < 1 /* 60 */) {
    const status = inputFormatContext.readFrame(packet)
    if (!status) throw new Error('readFrame failure')

    const { dts: realDTS, pts: realPTS } = packet

    const [msDTS, msPTS] = [
      packet.dtsFor(TIMEBASE_MS),
      packet.ptsFor(TIMEBASE_MS)
    ]

    t.not(realDTS, -1, 'realtime dts is set')
    t.not(realPTS, -1, 'realtime pts is set')

    // console.log('pre packet.timeBase', packet.timeBase, packet.dts, streamTimeBase)
    console.log('packet.timeBase', packet.timeBase, packet.dts, streamTimeBase)

    t.alike(packet.timeBase, streamTimeBase, 'captured packet inherits timebase')

    // forward frame to decoder
    rawDecoder.sendPacket(packet)
    packet.unref()

    console.log('pre frame timebase', rawFrame.timeBase, 'pts', rawFrame.pts)
    while (rawDecoder.receiveFrame(rawFrame)) {
      console.log('frame timebase', rawFrame.timeBase, 'pts', rawFrame.pts)
      t.is(rawFrame.pts, realPTS)
      t.alike(rawFrame.timeBase, rawDecoder.timeBase, 'timebase inherited by decoder')

      scaler.scale(rawFrame, yuvFrame)
      t.is(yuvFrame.pts, rawFrame.pts, 'timestamp is not lost by scaler')
      t.is(yuvFrame.timeBase, rawFrame.timeBase, 'timebase is not lost scaler')
      t.is(yuvFrame.width, OUTPUT_WIDTH)
      t.is(yuvFrame.height, OUTPUT_HEIGHT)

      encoder.sendFrame(yuvFrame)

      while (encoder.receivePacket(packet)) {
        t.alike(packet.timeBase, encoder.timeBase, 'encoder converts timebase')
        t.not(packet.dts, -1)
        t.not(packet.pts, -1)
        t.not(packet.dts, realDTS, 'dts converted')
        t.not(packet.pts, realPTS, 'pts converted')

        const [encMsDTS, encMsPTS] = [
          packet.dtsFor(TIMEBASE_MS),
          packet.ptsFor(TIMEBASE_MS)
        ]

        t.is(encMsDTS, msDTS, 'dts rescales correctly')
        t.is(encMsPTS, msPTS, 'pts rescales correctly')

        // Simulate serialization
        const payload = {
          data: packet.data.slice(0), // copy
          timeBase: packet.timeBase, // isRequired?
          dts: packet.dts,
          pts: packet.pts // is generated by decoder?
        }
        packet.unref()

        // BEGIN DECODING
        const decoderPacket = new ffmpeg.Packet(payload.buffer)
        decoderPacket.dts = payload.dts
        decoderPacket.pts = payload.pts
        // decoderPacket.timeBase = payload.timeBase

        decoder.sendPacket(decoderPacket)
        decoderPacket.unref()

        while (decoder.receiveFrame(yuvDecoded)) {
          t.not(yuvDecoded.pts, -1)

          t.alike(yuvDecoded.timeBase, OUTPUT_TIMEBASE, 'packet has final timebase')

          console.log('render frame @', yuvDecoded.ptsFor(TIMEBASE_MS), 'ms')
        }
      }

      nTranscoded++
    }
  }

  await clean()
})

// keyword 'using' breaks eslint
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
          await (r[Symbol.asyncDispose] || r[Symbol.dispose])()
        } catch (error) {
          console.log('resource dispose failed for', r)
          throw error
        }
      }
    }
  }
}
