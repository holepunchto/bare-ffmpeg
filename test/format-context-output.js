const test = require('brittle')
const ffmpeg = require('..')
const { sampleFormats } = require('../lib/constants')

const {
  logLevels,
  formatFlags,
  codecFlags
} = ffmpeg.constants
ffmpeg.logLevel = logLevels.ERROR

const FRAMERATE = 50
const SAMPLERATE = 48000

test('write webm', async (t) => {
  const { defer, clean } = usingDefer()

  // Input

  const inContext = avsynctestInput()
  defer(inContext)

  // Output IO

  const fileStream = require('fs').createWriteStream('out_dump.webm')

  const writeRequests = []
  const onwrite = buffer => {
    const done = new Promise((resolve, reject) => {
      fileStream.write(buffer, err => {
        if (err) reject(err)
        else resolve()
      })
    })

    writeRequests.push(done)
  }

  const io = new ffmpeg.IOContext(4096, onwrite)
  // defer(io) // ownership taken by OutputFormatContext

  // Output format

  const outFormat = new ffmpeg.OutputFormat('webm')
  const outContext = new ffmpeg.OutputFormatContext(outFormat, io)
  defer(outContext)

  const {
    inputStream: audioInputStream,
    decoder: audioDecoder,
    encoder: audioEncoder
  } = addAudioStream(t, outFormat, inContext, outContext)
  defer(audioDecoder)
  defer(audioEncoder)

  const {
    inputStream: videoInputStream,
    decoder: videoDecoder,
    encoder: videoEncoder
  } = addVideoStream(t, outFormat, inContext, outContext)
  defer(videoDecoder)
  defer(videoEncoder)


  outContext.dump(0) // print output format (logLevel.TRACE)

  outContext.writeHeader()

  // Transcode

  const frame = new ffmpeg.Frame()
  defer(frame)

  const audioFrame = new ffmpeg.Frame()
  defer(audioFrame)

  const packet = new ffmpeg.Packet()

  let captured = 0
  let encoded = 0
  const start = Date.now()
  let lastFrame = start

  // while (captured < 4) {
  while (Date.now() - start < 15000) {
    let status = inContext.readFrame(packet)
    if (!status) throw new Error('failed capturing frame')

    const { streamIndex } = packet

    // transcode audio (samplerate > framerate)

    if (streamIndex === audioInputStream.index) {
      packet.streamIndex = videoInputStream.index

      status = audioDecoder.sendPacket(packet)
      if (!status) throw new Error('failed decoding packet')

      packet.unref()

      while (audioDecoder.receiveFrame(audioFrame)) {
        const hasCapacity = audioEncoder.sendFrame(audioFrame)
        if (!hasCapacity) throw new Error('audio encoder full')

        pumpOutput()
      }
    }

    // transcode video

    if (streamIndex === videoInputStream.index) {
      packet.streamIndex = videoInputStream.index
      status = videoDecoder.sendPacket(packet)
      if (!status) throw new Error('failed decoding packet')

      packet.unref()

      while (videoDecoder.receiveFrame(frame)) {
        captured++

        const hasCapacity = videoEncoder.sendFrame(frame)
        if (!hasCapacity) throw new Error('video encoder full')

        pumpOutput()
      }
    }

    await delay((1000 / FRAMERATE) - (Date.now() - lastFrame))

    lastFrame = Date.now()
  }

  function pumpOutput () {
    while (audioEncoder.receivePacket(packet)) {
      packet.streamIndex = audioInputStream.index

      outContext.writeFrame(packet)
      packet.unref()

      encoded++
    }

    while (videoEncoder.receivePacket(packet)) {
      packet.streamIndex = videoInputStream.index

      outContext.writeFrame(packet)
      packet.unref()

      encoded++
    }
  }

  videoEncoder.sendFrame(null) // end-of-stream

  pumpOutput()

  outContext.writeTrailer()
  await Promise.all(writeRequests)

  fileStream.destroy()

  t.is(captured, encoded, 'transcoding complete')

  await clean()
})

function avsynctestInput () {
  const options = new ffmpeg.Dictionary()

  const graph = `
    avsynctest=
      size=hd720:
      framerate=${FRAMERATE}:
      period=1:
      samplerate=${SAMPLERATE}:
      amplitude=0.4:
      duration=20
    [a][v];
    [a]aformat=sample_fmts=s16[out0];
    [v]copy[out1]
  `.replace(/\s+/g, '')

  options.set('graph', graph)
  // options.set('graph', 'avsynctest=size=hd720:framerate=60:period=1:samplerate=48000:amplitude=0.4[out0][out1]')

  const format = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options
  )

  format.dump()

  return format
}

/**
 * @param {ffmpeg.OutputFormat} format
 * @param {ffmpeg.OutputFormatContext} outContext
 * @param {ffmpeg.InputFormatContext} inContext
 */
function addAudioStream (t, format, inContext, outContext) {
  const inputStream = inContext.getBestStream(ffmpeg.constants.mediaTypes.AUDIO)
  if (!inputStream) throw new Error('getStream failed')

  t.alike(inputStream.timeBase, new ffmpeg.Rational(1, SAMPLERATE))

  const audioIdx = inputStream.index
  t.is(audioIdx, 0, 'audio stream index')

  const { sampleRate, channelLayout, bitrate } = inputStream.codecParameters
  t.is(sampleRate, SAMPLERATE, 'samplerate')
  t.is(channelLayout.nbChannels, 1, 'mono input')

  const decoder = inputStream.decoder()
  t.is(decoder.sampleRate, sampleRate)
  // t.is(decoder.channelLayout.id, channelLayout, 'channel layout') // .id not implemented

  const stubBitRate = inputStream.codecParameters.bitsPerCodedSample * sampleRate
  console.log('inputStream bitrate', bitrate, 'computed', stubBitRate)

  const outputStream = outContext.createStream()

  const encoder = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.encoder)

  encoder.sampleRate = sampleRate
  encoder.channelLayout = channelLayout
  encoder.sampleFormat = decoder.sampleFormat
  encoder.timeBase = inputStream.timeBase

  const encOpts = new ffmpeg.Dictionary()
  encOpts.set('b', String(stubBitRate))
  encOpts.set('frame_duration', '16.666')
  encoder.open()

  // configure output stream to match encoder
  outputStream.codecParameters.fromContext(encoder)

  outputStream.timeBase = inputStream.timeBase
  outputStream.id = 1 // user defined
  outputStream.codecParameters.bitRate = stubBitRate // inputStream.codecParameters.bitRate

  t.is(outputStream.id, 1, 'id')
  t.is(outputStream.index, 1, 'stream index')
  t.alike(outputStream.timeBase, inputStream.timeBase, 'samplerate')
  t.is(outputStream.codec, ffmpeg.Codec.OPUS, 'codec set')

  // assert param's props
  t.is(outputStream.codecParameters.codecType, ffmpeg.constants.mediaTypes.AUDIO, 'media type')
  t.is(outputStream.codecParameters.codecId, ffmpeg.Codec.OPUS.id, 'codec')
  t.is(outputStream.codecParameters.sampleRate, sampleRate, 'output samplerate')

  return { inputStream, decoder, encoder }
}

/**
 * @param {ffmpeg.OutputFormat} format
 * @param {ffmpeg.OutputFormatContext} outContext
 * @param {ffmpeg.InputFormatContext} inContext
 */
function addVideoStream (t, format, inContext, outContext) {
  // Decoder

  const inputStream = inContext.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
  if (!inputStream) throw new Error('getStream failed')

  t.alike(inputStream.timeBase, new ffmpeg.Rational(1, FRAMERATE))

  const videoIdx = inputStream.index
  t.is(videoIdx, 1, 'video stream index')

  const { width, height } = inputStream.codecParameters
  t.is(width, 1280)
  t.is(height, 720)

  const decoder = inputStream.decoder()

  decoder.timeBase = inputStream.timeBase // TODO: remove after PR#57 merge
  t.alike(decoder.timeBase, inputStream.timeBase, 'decoder.timebase')

  t.is(decoder.pixelFormat, ffmpeg.constants.pixelFormats.YUV420P)
  decoder.open()

  // Encoder

  const outputStream = outContext.createStream()

  const encoder = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  encoder.width = width
  encoder.height = height
  encoder.pixelFormat = decoder.pixelFormat
  encoder.timeBase = inputStream.timeBase

  if (format.flags & formatFlags.GLOBALHEADER) {
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

  return { inputStream, decoder, encoder }
}

function delay (millis) {
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
