const test = require('brittle')
const ffmpeg = require('..')
const { sampleFormats, pixelFormats } = require('../lib/constants')

const { formatFlags, codecFlags, mediaTypes } = ffmpeg.constants

// ffmpeg.log.level = ffmpeg.log.INFO

const FRAMERATE = 50
const SAMPLERATE = 48000
const DURATION = 1

test('write webm', async (t) => {
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

  // TODO: muxer/webm bug if you swap stream order [A,V] => [V,A]
  const {
    inputStream: audioInputStream,
    decoder: audioDecoder,
    encoder: audioEncoder
  } = addAudioStream(t, outFormat, inContext, outContext)

  const {
    inputStream: videoInputStream,
    decoder: videoDecoder,
    encoder: videoEncoder
  } = addVideoStream(t, outFormat, inContext, outContext)

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
      packet.streamIndex = videoInputStream.index

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
      packet.streamIndex = videoInputStream.index

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

  audioEncoder.sendFrame(null) // end-of-stream
  videoEncoder.sendFrame(null) // end-of-stream

  pumpOutput()

  outContext.writeTrailer()

  t.is(captured, encoded - 1, 'transcoding complete')

  audioFrame.destroy()
  frame.destroy()
  videoEncoder.destroy()
  videoDecoder.destroy()
  audioEncoder.destroy()
  audioDecoder.destroy()
  outContext.destroy()
  inContext.destroy()

  validateOutput(t, Buffer.concat(buffers))
})

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
function addAudioStream(t, format, inContext, outContext) {
  const inputStream = inContext.getBestStream(mediaTypes.AUDIO)
  if (!inputStream) throw new Error('getStream failed')

  t.alike(inputStream.timeBase, new ffmpeg.Rational(1, SAMPLERATE))

  const audioIdx = inputStream.index
  t.is(audioIdx, 0, 'audio stream index')

  const { sampleRate, channelLayout, bitRate } = inputStream.codecParameters
  t.is(sampleRate, SAMPLERATE, 'samplerate')
  t.is(channelLayout.nbChannels, 1, 'mono input')

  const decoder = inputStream.decoder()
  t.is(decoder.sampleRate, sampleRate)
  // t.is(decoder.channelLayout.id, channelLayout, 'channel layout') // TODO: .id not implemented

  const calcBitrate =
    inputStream.codecParameters.bitsPerCodedSample * sampleRate

  t.is(bitRate, calcBitrate, 'bitrate')

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

  t.is(outputStream.id, 1, 'id')
  t.is(outputStream.index, 0, 'stream index')
  t.alike(outputStream.timeBase, inputStream.timeBase, 'time base')
  t.is(outputStream.codec, ffmpeg.Codec.OPUS, 'codec set')

  // assert param's props
  t.is(outputStream.codecParameters.codecType, mediaTypes.AUDIO, 'media type')
  t.is(outputStream.codecParameters.codecId, ffmpeg.Codec.OPUS.id, 'codec')
  t.is(outputStream.codecParameters.sampleRate, sampleRate, 'output samplerate')

  return { inputStream, decoder, encoder }
}

/**
 * @param {ffmpeg.OutputFormat} format
 * @param {ffmpeg.OutputFormatContext} outContext
 * @param {ffmpeg.InputFormatContext} inContext
 */
function addVideoStream(t, format, inContext, outContext) {
  // Decoder

  const inputStream = inContext.getBestStream(mediaTypes.VIDEO)
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
  t.is(outputStream.index, 1, 'stream index')
  t.alike(outputStream.timeBase, inputStream.timeBase, 'timeBase')
  t.is(outputStream.codec, ffmpeg.Codec.AV1, 'codec set')

  // assert param's props
  t.is(outputStream.codecParameters.codecType, mediaTypes.VIDEO, 'media type')
  t.is(outputStream.codecParameters.codecId, ffmpeg.Codec.AV1.id, 'codec')
  t.is(outputStream.codecParameters.width, width, 'width')
  t.is(outputStream.codecParameters.height, height, 'height')

  return { inputStream, decoder, encoder }
}

function delay(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis))
}

function validateOutput(t, data) {
  t.ok(data, 'webm encoded')
  // require('fs').writeFileSync('out_dump.webm', data)

  const io = new ffmpeg.IOContext(data)

  const format = new ffmpeg.InputFormatContext(io)
  t.is(format.streams.length, 2, 'contains audio+video')

  // format.dump()

  // verify audio

  const audioStream = format.getBestStream(mediaTypes.AUDIO)

  t.is(audioStream.index, 0)
  t.alike(audioStream.timeBase, new ffmpeg.Rational(1, 1000))

  t.is(audioStream.codec.name, 'opus', 'codec')

  const ap = audioStream.codecParameters

  t.is(ap.sampleRate, 48000, 'samplerate')
  t.is(ap.format, sampleFormats.FLTP, 'sample format')

  t.is(ap.nbChannels, 1, 'nbChannels')
  t.alike(ap.channelLayout.nbChannels, 1, 'channelLayout')

  // verify video

  const videoStream = format.getBestStream(mediaTypes.VIDEO)

  t.is(videoStream.index, 1)
  t.alike(videoStream.timeBase, new ffmpeg.Rational(1, 1000))
  t.is(videoStream.codec.name, 'av1', 'codec')

  const vp = videoStream.codecParameters

  t.is(vp.width, 1280, 'width')
  t.is(vp.height, 720, 'height')
  t.is(vp.format, pixelFormats.YUV420P, 'pixel format')

  format.destroy()
}
