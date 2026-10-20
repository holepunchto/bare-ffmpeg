const test = require('brittle')
const ffmpeg = require('..')

test('AudioFIFO - write', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFIFO({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })

  const written = fifo.write(writeFrame)
  t.is(written, nbSamples, 'writes all samples')
  t.is(fifo.size, nbSamples)
  t.is(fifo.space, 0)
})

test('AudioFIFO - read', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFIFO({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })
  using readFrame = createAudioFrame({ nbSamples })

  const written = fifo.write(writeFrame)
  t.is(written, nbSamples, 'writes all samples')
  t.is(fifo.size, nbSamples)
  t.is(fifo.space, 0)

  const read = fifo.read(readFrame, nbSamples)
  t.is(read, nbSamples, 'reads all samples')
  t.is(fifo.size, 0)
  t.is(fifo.space, nbSamples)
})

test('AudioFIFO - peek', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFIFO({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })
  using peekFrame = createAudioFrame({ nbSamples })

  fifo.write(writeFrame)

  const peeked = fifo.peek(peekFrame, nbSamples)
  t.is(peeked, nbSamples, 'peek at everything')
  t.is(fifo.size, nbSamples)
})

test('AudioFIFO - drain', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFIFO({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })

  fifo.write(writeFrame)
  fifo.drain(nbSamples / 2)

  t.is(fifo.size, nbSamples / 2)
  t.is(fifo.space, nbSamples / 2)
})

test('AudioFIFO - grows capacity as needed', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFIFO({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })

  const written1 = fifo.write(writeFrame)
  t.is(written1, nbSamples, 'writes initial samples')
  t.is(fifo.size, nbSamples)

  const written2 = fifo.write(writeFrame)
  t.is(written2, nbSamples, 'writes new data, grows capacity')
  t.is(fifo.size, nbSamples * 2)
})

test('AudioFIFO - reads only available samples', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFIFO({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples: nbSamples / 2 })
  using readFrame = createAudioFrame({ nbSamples })

  fifo.write(writeFrame)

  const read = fifo.read(readFrame, nbSamples)
  t.is(read, nbSamples / 2, 'reads only the available samples')
  t.is(fifo.size, 0)
})

test('audio fifo with planar format', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFIFO({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })
  using readFrame = createAudioFrame({ nbSamples })

  const written = fifo.write(writeFrame)
  t.is(written, nbSamples, 'writes all samples for planar')
  t.is(fifo.size, nbSamples)

  const read = fifo.read(readFrame, nbSamples)
  t.is(read, nbSamples, 'reads all samples for planar')
})

test('audio fifo with planar format and more than eight channels', (t) => {
  const nbSamples = 1024
  const options = {
    nbSamples,
    channels: 16,
    channelLayout: 0xffff,
    sampleFormat: ffmpeg.constants.sampleFormats.FLTP
  }
  using fifo = createAudioFIFO(options)
  using writeFrame = createAudioFrame(options)
  using readFrame = createAudioFrame(options)

  t.is(fifo.write(writeFrame), nbSamples)
  t.is(fifo.peek(readFrame, nbSamples), nbSamples)
  t.is(fifo.read(readFrame, nbSamples), nbSamples)
})

test('audio fifo rejects frames that do not match its configuration', (t) => {
  using fifo = createAudioFIFO()
  using monoFrame = createAudioFrame({ channelLayout: ffmpeg.constants.channelLayouts.MONO })
  using floatFrame = createAudioFrame({ sampleFormat: ffmpeg.constants.sampleFormats.FLT })

  t.exception(() => fifo.write(monoFrame))
  t.exception(() => fifo.write(floatFrame))
  t.exception(() => fifo.read(monoFrame, 1024))
  t.exception(() => fifo.peek(monoFrame, 1024))
})

function createAudioFIFO({
  channels = 2,
  nbSamples = 1024,
  sampleFormat = ffmpeg.constants.sampleFormats.S16
} = {}) {
  return new ffmpeg.AudioFIFO(sampleFormat, channels, nbSamples)
}

function createAudioFrame({
  nbSamples = 1024,
  sampleFormat = ffmpeg.constants.sampleFormats.S16,
  channelLayout = ffmpeg.constants.channelLayouts.STEREO
} = {}) {
  const frame = new ffmpeg.Frame()
  frame.format = sampleFormat
  frame.nbSamples = nbSamples
  frame.channelLayout = channelLayout
  frame.alloc()
  return frame
}
