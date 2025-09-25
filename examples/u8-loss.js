const ffmpeg = require('..')
const assert = require('bare-assert')

const DEBUG_ENABLED = true
const SAMPLE_RATE = 48000
const RFRAME_SIZE = 2000
const OPUS_OP_FREQ = 48e3 /* 48kHz */
const OPUS_CLOCK = new ffmpeg.Rational(1, OPUS_OP_FREQ)

let pts = -1

const inputFormat = sine(3000, {
  sampleRate: SAMPLE_RATE,
  sampleFormat: 'u8'
})
const inputStream = inputFormat.getBestStream(ffmpeg.constants.mediaTypes.AUDIO)
const decoder = inputStream.decoder()

// TODO: use openInput later to perform
const { outputFormat, openInput } = createBufferedOutput()

const outputStream = outputFormat.createStream()
outputStream.codecParameters.type = ffmpeg.constants.mediaTypes.AUDIO
outputStream.codecParameters.id = ffmpeg.Codec.OPUS.id
outputStream.codecParameters.sampleRate = SAMPLE_RATE
outputStream.codecParameters.channelLayout =
  inputStream.codecParameters.channelLayout
outputStream.codecParameters.format = ffmpeg.constants.sampleFormats.S16
outputStream.timeBase = new ffmpeg.Rational(1, SAMPLE_RATE)
debug(outputStream.codecParameters.sampleRate)
const encoder = outputStream.encoder()

let outputFrameSize = (20 * outputStream.codecParameters.sampleRate) / 1000

const frame = new ffmpeg.Frame()

const resampler = new ffmpeg.Resampler(
  inputStream.codecParameters.sampleRate,
  inputStream.codecParameters.channelLayout,
  inputStream.codecParameters.format,
  outputStream.codecParameters.sampleRate,
  outputStream.codecParameters.channelLayout,
  outputStream.codecParameters.format
)

const resampledFrame = new ffmpeg.Frame()
resampledFrame.nbSamples = RFRAME_SIZE
resampledFrame.format = outputStream.codecParameters.format
resampledFrame.channelLayout = outputStream.codecParameters.channelLayout
resampledFrame.alloc()

const bufferedFrame = new ffmpeg.Frame()
bufferedFrame.nbSamples = (20 * outputStream.codecParameters.sampleRate) / 1000
bufferedFrame.format = outputStream.codecParameters.format
bufferedFrame.channelLayout = outputStream.codecParameters.channelLayout
bufferedFrame.alloc()

const fifo = new ffmpeg.AudioFIFO(
  inputStream.codecParameters.format,
  inputStream.codecParameters.nbChannels,
  64
)

outputFormat.writeHeader()

const packet = new ffmpeg.Packet()
while (inputFormat.readFrame(packet)) {
  debug('1', 'Frame read')
  if (packet.streamIndex !== inputStream.index) continue

  const status = decoder.sendPacket(packet)
  debug('2', 'Packet sent')
  if (!status) throw new Error('failed decoding packet')
  packet.unref()

  while (decoder.receiveFrame(frame)) {
    debug('3', 'Frame received')
    if (pts === -1) {
      // TODO: negative infinity if keeping
      pts = ffmpeg.Rational.rescaleQ(
        frame.pts,
        inputStream.timeBase,
        outputStream.timeBase
      )
    }
    resampledFrame.nbSamples = RFRAME_SIZE
    const nbResampled = resampler.convert(frame, resampledFrame)
    debug('4', 'Frame converted')
    resampledFrame.nbSamples = nbResampled

    fifo.write(resampledFrame)
    debug('5', 'Write to fifo')

    while (fifo.size >= outputFrameSize) {
      const n = fifo.read(bufferedFrame, outputFrameSize)
      debug('6', 'Read from fifo')

      bufferedFrame.pts = ffmpeg.Rational.rescaleQ(
        pts,
        outputStream.timeBase,
        OPUS_CLOCK
      )
      debug('7', 'Rescaled')
      bufferedFrame.packetDTS = bufferedFrame.pts
      pts += n

      const hasCapacity = encoder.sendFrame(bufferedFrame)
      debug('8', 'Frame sent to encoder')
      if (!hasCapacity) throw new Error('encoder full')

      const p = new ffmpeg.Packet()
      while (encoder.receivePacket(p)) {
        debug('9', 'Packet received from encoder')
        p.streamIndex = outputStream.index

        outputFormat.writeFrame(p)
        debug('10', 'Packet writed to output format')
        p.unref()
      }
    }
  }
}

encoder.sendFrame(null)
outputFormat.writeTrailer()

inputFormat.destroy()
outputFormat.destroy()

debug('write complete!')

// Helpers

function sine(duration = 3000, opts = {}) {
  const samplerate = opts.sampleRate || 48000
  const sampleFormat = opts.sampleFormat || 's16'
  const freq = opts.frequency || 150
  const frameSize = opts.frameSize || 1024

  const options = new ffmpeg.Dictionary()

  const graph = `
    sine=frequency=${freq}:
      sample_rate=${samplerate}:
      duration=${duration},
      volume=+14dB,
      asetnsamples=n=${frameSize},
      aformat=sample_fmts=${sampleFormat}[out0]
  `.replace(/\s+/g, '')

  options.set('graph', graph)

  const format = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options
  )

  return format
}

function createBufferedOutput(formatType = 'webm') {
  const chunks = []
  const onwrite = (chunk) => chunks.push(chunk)
  const io = new ffmpeg.IOContext(Buffer.alloc(4096), { onwrite })
  const outputFormat = new ffmpeg.OutputFormatContext(formatType, io)

  return { outputFormat, openInput }

  function openInput() {
    const io = new ffmpeg.IOContext(Buffer.concat(chunks))
    return new ffmpeg.InputFormatContext(io)
  }
}

function debug(...args) {
  if (DEBUG_ENABLED) console.log(...args)
}
