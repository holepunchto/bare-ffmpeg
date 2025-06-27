const test = require('brittle')
const ffmpeg = require('..')

test('AudioFifo - write', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFifo({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })

  const written = fifo.write(writeFrame)
  t.is(written, nbSamples, 'writes all samples')
  t.is(fifo.size, nbSamples)
  t.is(fifo.space, 0)
})

test('AudioFifo - read', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFifo({ nbSamples })
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

test('AudioFifo - peek', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFifo({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })
  using peekFrame = createAudioFrame({ nbSamples })

  fifo.write(writeFrame)

  const peeked = fifo.peek(peekFrame, nbSamples)
  t.is(peeked, nbSamples, 'peek at everything')
  t.is(fifo.size, nbSamples)
})

test('AudioFifo - drain', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFifo({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })

  fifo.write(writeFrame)
  fifo.drain(nbSamples / 2)

  t.is(fifo.size, nbSamples / 2)
  t.is(fifo.space, nbSamples / 2)
})

test('AudioFifo - grows capacity as needed', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFifo({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })

  const written1 = fifo.write(writeFrame)
  t.is(written1, nbSamples, 'writes initial samples')
  t.is(fifo.size, nbSamples)

  const written2 = fifo.write(writeFrame)
  t.is(written2, nbSamples, 'writes new data, grows capacity')
  t.is(fifo.size, nbSamples * 2)
})

test('AudioFifo - reads only available samples', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFifo({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples: nbSamples / 2 })
  using readFrame = createAudioFrame({ nbSamples })

  fifo.write(writeFrame)

  const read = fifo.read(readFrame, nbSamples)
  t.is(read, nbSamples / 2, 'reads only the available samples')
  t.is(fifo.size, 0)
})

test('audio fifo with planar format', (t) => {
  const nbSamples = 1024
  using fifo = createAudioFifo({ nbSamples })
  using writeFrame = createAudioFrame({ nbSamples })
  using readFrame = createAudioFrame({ nbSamples })

  const written = fifo.write(writeFrame)
  t.is(written, nbSamples, 'writes all samples for planar')
  t.is(fifo.size, nbSamples)

  const read = fifo.read(readFrame, nbSamples)
  t.is(read, nbSamples, 'reads all samples for planar')
})

function createAudioFifo({
  channels = 2,
  nbSamples = 1024,
  sampleFormat = ffmpeg.constants.sampleFormats.S16
} = {}) {
  return new ffmpeg.AudioFifo(sampleFormat, channels, nbSamples)
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
