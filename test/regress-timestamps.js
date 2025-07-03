const test = require('brittle')

const ffmpeg = require('..')

/**
 *
 * TL;DR; Researched what i can for now.
 * need to rewrite muxer in order to finish this patch.
 *
 * The Problem:
 * Format & Encoder contexts have/provide time_base.
 *
 * Packet.time_base and Frame.time_base are mostly unused
 * by encoders (installed assert guards)
 *
 * The common way to implement ffmpeg timestamps:
 *  - Take `Ts` = InputFormat::Stream(n).time_base
 *  - ignore member time_base on Packet & Frame
 *  - treat dts/pts as frame-id while it's inside the pipeline.
 *  - let muxer deal with `Ts x packet.pts`
 *
 * Pros:
 *  - less headache during capture/prefilter
 *  - raw timestamps
 * Cons:
 *  - Time unavailable inside pipeline
 *  - Encoders that expect timebase to equal framerate receive invalid timestamps.
 *  - OutputFormat has to recreate time by matching packets to multiple streams' `Ts`
 *    in order to perform a synchroneous flush.
 *
 *
 * This patch introduces feature AUTO_TIMEBASE (experimental)
 * Where we simply set packet.time_base to `Ts` and
 * ensure that known information is never lost in-between pipeline-ops.
 *
 * Pros:
 *  - Each frame & packet always have valid timestamps (well defined TimeBase)
 *  - Reduce complexity when muxing streams
 * Cons:
 *  - Precision loss
 *  - "when in doubt" ffmpeg resets time_base to (0 / 1).
 *
 * AVInputFormatContext.streams[0].time_base; contains persisted/generated timebase
 * AVCodecContext.pkt_timebase; specifies incoming packet's timebase during decoding
 * AVCodecContext.time_base; specifies incoming packet's timebase during encoding
 *
 * Records from another ffmpeg-user:
 * https://github.com/PyAV-Org/PyAV/issues/397
 *
 */
test('timebase information is preserved between operations for video capture', async t => {
  const { defer, clean } = usingWorkaround()

  const FRAMERATE = 30
  const OUTPUT_WIDTH = 854
  const OUTPUT_HEIGHT = 480
  // divisble by 48kHZ & 30/60fps
  const OUTPUT_TIMEBASE = new ffmpeg.Rational(1, 90000)


  let nCaptured = 0
  let nEncoded = 0

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
  t.is(streamTimeBase.denominator, 1000000, 'realtime microsecond captures')

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

  encOptions.set('g', FRAMERATE)
  encOptions.set('header_insertion_mode', 'gop')

  const encoder = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  defer(encoder)

  encoder.width = yuvFrame.width
  encoder.height = yuvFrame.height
  encoder.pixelFormat = yuvFrame.pixelFormat
  encoder.timeBase = new ffmpeg.Rational(1, FRAMERATE) /* AV1 requires timebase = fps */
  encoder.open(encOptions)

  t.is(encoder.gopSize, FRAMERATE, 'option "g" sets gop_size')

  // init decoder state

  const decoder = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.decoder)
  defer(decoder)

  decoder.timeBase = encoder.timeBase

  decoder.open()

  const yuvDecoded = new ffmpeg.Frame()
  defer(yuvDecoded)

  // BEGIN ENCODING
  const packet = new ffmpeg.Packet()

  const workLog = []

  let nTranscoded = 0
  while (nTranscoded < 60) {
    const status = inputFormatContext.readFrame(packet)
    if (!status) throw new Error('readFrame failure')

    nCaptured++

    const { dts: realDTS, pts: realPTS } = packet

    t.alike(packet.timeBase, streamTimeBase, 'captured packet inherits stream timebase')

    t.not(realPTS, -1, 'captured pts is set')
    t.is(realDTS, realPTS, 'captured pts = dts')

    workLog.push({ pts: realPTS, timeBase: packet.timeBase })

    // forward frame to decoder
    rawDecoder.sendPacket(packet)
    packet.unref()

    while (rawDecoder.receiveFrame(rawFrame)) {
      t.is(rawFrame.pts, realPTS, 'timestamp not lost by rawDecoder')
      t.alike(rawFrame.timeBase, rawDecoder.timeBase, 'timebase is not lost rawDecoder')

      scaler.scale(rawFrame, yuvFrame)

      t.is(yuvFrame.pts, rawFrame.pts, 'timestamp is not lost by scaler')
      t.alike(yuvFrame.timeBase, rawFrame.timeBase, 'timebase is not lost scaler')
      t.is(yuvFrame.width, OUTPUT_WIDTH)
      t.is(yuvFrame.height, OUTPUT_HEIGHT)

      /** ffmpeg default behaviour;
       * Encoder does not touch the timestamp (passthrough)
       * but it does discard the timebase; (sets to 0 over 1)
       *
       * The encoder.timebase required to be set to framerate.
       * So encoder.sendFrame now converts timestamps:
       *    frame.pts = frame.ptsFor(encoder.timebase)
       *    frame.timebase = encoder.timebase
       *
       * FIXME: precision loss
       */
      encoder.sendFrame(yuvFrame)

      while (encoder.receivePacket(packet)) {
        nEncoded++

        t.alike(packet.timeBase, encoder.timeBase, 'encoder converts timebase')

        const task = workLog.shift()

        if (packet.dts !== packet.pts) {
          console.info('pts generated by compression')
        }

        // NOTE precision loss during convert encode
        const rescaled = task.timeBase.rescale_q(task.pts, packet.timeBase)
        t.is(packet.pts, rescaled, 'packets processed fifo')

        // Simulate serialization
        const payload = {
          data: packet.data.slice(), // copy
          timeBase: packet.timeBase,
          // NOTE want higher res here. (keep Audio/Video in sync)
          pts: packet.pts,
          dts: packet.dts
        }
        packet.unref()

        // BEGIN DECODING
        const decoderPacket = new ffmpeg.Packet(payload.data)
        decoderPacket.dts = payload.dts
        decoderPacket.pts = payload.pts
        decoderPacket.timeBase = packet.timeBase // set by inputformat

        decoder.sendPacket(decoderPacket)
        decoderPacket.unref()

        while (decoder.receiveFrame(yuvDecoded)) {
          t.not(yuvDecoded.pts, -1, 'timestamp not lost by decoder')
          t.alike(yuvDecoded.timeBase, payload.timeBase, 'timebase not lost by decoder')

          // TODO:
          // t.alike(yuvDecoded.timeBase, OUTPUT_TIMEBASE, 'packet has final timebase')

          const msTimebase = new ffmpeg.Rational(1, 1000)
          t.comment('render frame @', yuvDecoded.ptsFor(msTimebase), 'ms')
        }
      }

      nTranscoded++
    }
  }

  // TODO: redo loops/ encoder is not flushed at test end
  t.comment('captured', nCaptured, 'encoded', nEncoded)

  await clean()
})

test('packet & frame can convert timebase', async t => {
  const { defer, clean } = usingWorkaround()

  const ts = 9999999

  const expected = Math.round(ts * ((1 / 1e6) / (1 / 1000))) // av_rescale_q(t, Ta, Tb)

  // Packet

  const packet = new ffmpeg.Packet(Buffer.alloc(8))
  // defer(packet) // segfaults (dummy packet)

  packet.dts = ts
  packet.timeBase = new ffmpeg.Rational(1, 1e6)

  const target = new ffmpeg.Rational(1, 1000)


  t.is(packet.dtsFor(target), expected)

  packet.pts = ts

  t.is(packet.ptsFor(target), expected)

  // Frame

  const frame = new ffmpeg.Frame()
  frame.width = 240
  frame.height = 160
  frame.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
  // frame.alloc()
  // defer(frame) // segfaults (dummy frame)

  frame.timeBase = new ffmpeg.Rational(1, 1e6)

  frame.pts = ts

  t.is(packet.ptsFor(target), expected)

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
          await (r[Symbol.asyncDispose] || r[Symbol.dispose]).apply(r)
        } catch (error) {
          console.log('resource dispose failed for', r)
          throw error
        }
      }
    }
  }
}
