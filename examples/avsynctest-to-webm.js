const ffmpeg = require('..')
const assert = require('bare-assert')

const { formatFlags, codecFlags, mediaTypes, sampleFormats, pixelFormats } =
  ffmpeg.constants

const FRAMERATE = 50
const SAMPLERATE = 48000
const DURATION = 1

async function run() {
  // Input
  const inContext = avsynctestInput()

  // Output IO
  const buffers = []

  const onwrite = (buffer) => buffers.push(buffer)

  const io = new ffmpeg.IOContext(4096, {
    onwrite
  })

  // Output format

  const outFormat = new ffmpeg.OutputFormat('webm')
  const outContext = new ffmpeg.OutputFormatContext(outFormat, io)

  const {
    inputStream: audioInputStream,
    decoder: audioDecoder,
    encoder: audioEncoder,
    outputStream: audioOutputStream
  } = addAudioStream(outFormat, inContext, outContext)

  const {
    inputStream: videoInputStream,
    decoder: videoDecoder,
    encoder: videoEncoder,
    outputStream: videoOutputStream
  } = addVideoStream(outFormat, inContext, outContext)

  outContext.dump(0) // print output format (logLevel.TRACE)

  outContext.writeHeader()

  // Transcode

  const frame = new ffmpeg.Frame()

  const audioFrame = new ffmpeg.Frame()

  const packet = new ffmpeg.Packet()

  let captured = 0
  let encoded = 0
  const start = Date.now()
  let lastFrame = start

  while (true /* && captured < 3 */) {
    const eos = inContext.readFrame(packet)
    if (!eos) break

    captured++

    const { streamIndex } = packet

    // transcode audio

    if (streamIndex === audioInputStream.index) {
      const status = audioDecoder.sendPacket(packet)
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
      const status = videoDecoder.sendPacket(packet)
      if (!status) throw new Error('failed decoding packet')

      packet.unref()

      while (videoDecoder.receiveFrame(frame)) {
        const hasCapacity = videoEncoder.sendFrame(frame)
        if (!hasCapacity) throw new Error('video encoder full')

        pumpOutput()
      }
    }

    const waitMs = 1000 / FRAMERATE - (Date.now() - lastFrame)

    lastFrame = Date.now()

    await delay(waitMs)
  }
  function pumpOutput() {
    while (audioEncoder.receivePacket(packet)) {
      packet.streamIndex = audioOutputStream.index

      outContext.writeFrame(packet)
      packet.unref()

      encoded++
    }

    while (videoEncoder.receivePacket(packet)) {
      packet.streamIndex = videoOutputStream.index

      outContext.writeFrame(packet)
      packet.unref()

      encoded++
    }
  }

  audioEncoder.sendFrame(null) // end-of-stream
  videoEncoder.sendFrame(null) // end-of-stream

  pumpOutput()

  outContext.writeTrailer()

  assert.equal(captured, encoded - 1, 'transcoding complete')

  audioFrame.destroy()
  frame.destroy()
  videoEncoder.destroy()
  videoDecoder.destroy()
  audioEncoder.destroy()
  audioDecoder.destroy()
  outContext.destroy()
  inContext.destroy()

  validateOutput(Buffer.concat(buffers))
}

run()

// Helpers

function avsynctestInput() {
  const options = new ffmpeg.Dictionary()

  const graph = `
    avsynctest=
      size=hd720:
      framerate=${FRAMERATE}:
      period=1:
      samplerate=${SAMPLERATE}:
      amplitude=0.4:
      duration=${DURATION}
    [a][v];
    [a]aformat=sample_fmts=s16[out0];
    [v]copy[out1]
  `.replace(/\s+/g, '')

  options.set('graph', graph)

  const format = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options
  )

  format.dump()

  return format
}

/**
 * @param {ffmpeg.OutputFormat} format - not used
 * @param {ffmpeg.OutputFormatContext} outContext
 * @param {ffmpeg.InputFormatContext} inContext
 */
function addAudioStream(format, inContext, outContext) {
  const inputStream = inContext.getBestStream(mediaTypes.AUDIO)
  if (!inputStream) throw new Error('getStream failed')

  assert.equal(inputStream.timeBase.numerator, 1)
  assert.equal(inputStream.timeBase.denominator, SAMPLERATE)

  const audioIdx = inputStream.index
  assert.equal(audioIdx, 0, 'audio stream index')

  const { sampleRate, channelLayout, bitRate } = inputStream.codecParameters
  assert.equal(sampleRate, SAMPLERATE, 'samplerate')
  assert.equal(channelLayout.nbChannels, 1, 'mono input')

  const decoder = inputStream.decoder()
  assert.equal(decoder.sampleRate, sampleRate)
  assert.equal(decoder.channelLayout.mask, channelLayout.mask, 'channel layout')

  const calcBitrate =
    inputStream.codecParameters.bitsPerCodedSample * sampleRate

  assert.equal(bitRate, calcBitrate, 'bitrate')

  const outputStream = outContext.createStream()

  const encoder = new ffmpeg.CodecContext(ffmpeg.Codec.OPUS.encoder)

  encoder.sampleRate = sampleRate
  encoder.channelLayout = channelLayout
  encoder.sampleFormat = decoder.sampleFormat
  encoder.timeBase = inputStream.timeBase

  const encOpts = new ffmpeg.Dictionary()
  encOpts.set('b', bitRate)
  encOpts.set('frame_duration', 16.666)
  encoder.open()

  // configure output stream to match encoder
  outputStream.codecParameters.fromContext(encoder)

  outputStream.timeBase = inputStream.timeBase
  outputStream.id = 1 // user defined
  outputStream.codecParameters.bitRate = bitRate

  assert.equal(outputStream.id, 1, 'id')
  assert.equal(outputStream.index, 0, 'stream index')
  assert.equal(
    outputStream.timeBase.numerator,
    inputStream.timeBase.numerator,
    'time base numerator'
  )
  assert.equal(
    outputStream.timeBase.denominator,
    inputStream.timeBase.denominator,
    'time base denominator'
  )
  assert.equal(outputStream.codec, ffmpeg.Codec.OPUS, 'codec set')

  // assert param's props
  assert.equal(
    outputStream.codecParameters.type,
    mediaTypes.AUDIO,
    'media type'
  )
  assert.equal(outputStream.codecParameters.id, ffmpeg.Codec.OPUS.id, 'codec')
  assert.equal(
    outputStream.codecParameters.sampleRate,
    sampleRate,
    'output samplerate'
  )

  return { inputStream, decoder, encoder, outputStream }
}

/**
 * @param {ffmpeg.OutputFormat} format
 * @param {ffmpeg.OutputFormatContext} outContext
 * @param {ffmpeg.InputFormatContext} inContext
 */
function addVideoStream(format, inContext, outContext) {
  // Decoder

  const inputStream = inContext.getBestStream(mediaTypes.VIDEO)
  if (!inputStream) throw new Error('getStream failed')

  assert.equal(inputStream.timeBase.numerator, 1)
  assert.equal(inputStream.timeBase.denominator, FRAMERATE)

  const videoIdx = inputStream.index
  assert.equal(videoIdx, 1, 'video stream index')

  const { width, height } = inputStream.codecParameters
  assert.equal(width, 1280)
  assert.equal(height, 720)

  const decoder = inputStream.decoder()

  decoder.timeBase = inputStream.timeBase
  assert.equal(
    decoder.timeBase.numerator,
    inputStream.timeBase.numerator,
    'decoder.timebase.numerator'
  )
  assert.equal(
    decoder.timeBase.denominator,
    inputStream.timeBase.denominator,
    'decoder.timebase.denominator'
  )

  assert.equal(decoder.pixelFormat, ffmpeg.constants.pixelFormats.YUV420P)
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
  assert.equal(outputStream.id, 0, 'id')
  assert.equal(outputStream.index, 1, 'stream index')
  assert.equal(
    outputStream.timeBase.numerator,
    inputStream.timeBase.numerator,
    'timeBase numerator'
  )
  assert.equal(
    outputStream.timeBase.denominator,
    inputStream.timeBase.denominator,
    'timeBase denominator'
  )
  assert.equal(outputStream.codec, ffmpeg.Codec.AV1, 'codec set')

  // assert param's props
  assert.equal(
    outputStream.codecParameters.type,
    mediaTypes.VIDEO,
    'media type'
  )
  assert.equal(outputStream.codecParameters.id, ffmpeg.Codec.AV1.id, 'codec')
  assert.equal(outputStream.codecParameters.width, width, 'width')
  assert.equal(outputStream.codecParameters.height, height, 'height')

  return { inputStream, decoder, encoder, outputStream }
}

function delay(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis))
}

function validateOutput(data) {
  assert(data, 'webm encoded')

  const io = new ffmpeg.IOContext(data)

  const format = new ffmpeg.InputFormatContext(io)
  assert.equal(format.streams.length, 2, 'contains audio+video')

  // verify audio

  const audioStream = format.getBestStream(mediaTypes.AUDIO)

  assert.equal(audioStream.index, 0)
  assert.equal(audioStream.timeBase.numerator, 1)
  assert.equal(audioStream.timeBase.denominator, 1000)

  assert.equal(audioStream.codec.name, 'opus', 'codec')

  const ap = audioStream.codecParameters

  assert.equal(ap.sampleRate, 48000, 'samplerate')
  assert.equal(ap.format, sampleFormats.FLTP, 'sample format')

  assert.equal(ap.nbChannels, 1, 'nbChannels')
  assert.equal(ap.channelLayout.nbChannels, 1, 'channelLayout')

  // verify video

  const videoStream = format.getBestStream(mediaTypes.VIDEO)

  assert.equal(videoStream.index, 1)
  assert.equal(videoStream.timeBase.numerator, 1)
  assert.equal(videoStream.timeBase.denominator, 1000)
  assert.equal(videoStream.codec.name, 'av1', 'codec')

  const vp = videoStream.codecParameters

  assert.equal(vp.width, 1280, 'width')
  assert.equal(vp.height, 720, 'height')
  assert.equal(vp.format, pixelFormats.YUV420P, 'pixel format')

  format.destroy()
}
