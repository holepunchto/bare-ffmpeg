const test = require('brittle')
const ffmpeg = require('..')

test('AudioFifo - basics, read & write', (t) => {
  const sampleFormat = ffmpeg.constants.sampleFormats.S16
  const channels = 2
  const nbSamples = 1024
  const channelLayout = ffmpeg.constants.channelLayouts.STEREO

  using fifo = new ffmpeg.AudioFifo(sampleFormat, channels, nbSamples)
  t.ok(fifo, 'fifo is created')
  t.ok(fifo._handle, 'fifo has a handle')

  using writeFrame = new ffmpeg.Frame()
  writeFrame.format = sampleFormat
  writeFrame.nbSamples = nbSamples
  writeFrame.channelLayout = channelLayout
  writeFrame.alloc()

  const written = fifo.write(writeFrame)
  t.is(written, nbSamples, 'writes all samples')
  t.is(fifo.size, nbSamples)
  t.is(fifo.space, 0)

  using readFrame = new ffmpeg.Frame()
  readFrame.format = sampleFormat
  readFrame.nbSamples = nbSamples
  readFrame.channelLayout = channelLayout
  readFrame.alloc()

  const read = fifo.read(readFrame, nbSamples)
  t.is(read, nbSamples, 'reads all samples')
  t.is(fifo.size, 0)
  t.is(fifo.space, nbSamples)
})

test('AudioFifo - peek & drain', (t) => {
  const sampleFormat = ffmpeg.constants.sampleFormats.S16
  const channels = 2
  const nbSamples = 1024
  const channelLayout = ffmpeg.constants.channelLayouts.STEREO

  using fifo = new ffmpeg.AudioFifo(sampleFormat, channels, nbSamples)

  using frame = new ffmpeg.Frame()
  frame.format = sampleFormat
  frame.nbSamples = nbSamples
  frame.channelLayout = channelLayout
  frame.alloc()

  fifo.write(frame)

  using peekFrame = new ffmpeg.Frame()
  peekFrame.format = sampleFormat
  peekFrame.nbSamples = nbSamples
  peekFrame.channelLayout = channelLayout
  peekFrame.alloc()

  const peeked = fifo.peek(peekFrame, nbSamples)
  t.is(peeked, nbSamples, 'peek at everything')
  t.is(fifo.size, nbSamples)

  fifo.drain(nbSamples / 2)

  t.is(fifo.size, nbSamples / 2)
  t.is(fifo.space, nbSamples / 2)
})

test('AudioFifo - grows capacity as needed', (t) => {
  const sampleFormat = ffmpeg.constants.sampleFormats.S16
  const channels = 2
  const nbSamples = 1024
  const channelLayout = ffmpeg.constants.channelLayouts.STEREO

  using fifo = new ffmpeg.AudioFifo(sampleFormat, channels, nbSamples)

  using frame = new ffmpeg.Frame()
  frame.format = sampleFormat
  frame.nbSamples = nbSamples
  frame.channelLayout = channelLayout
  frame.alloc()

  const written1 = fifo.write(frame)
  t.is(written1, nbSamples, 'writes initial samples')
  t.is(fifo.size, nbSamples)

  const written2 = fifo.write(frame)
  t.is(written2, nbSamples, 'writes new data, grows capacity')
  t.is(fifo.size, nbSamples * 2)
})

test('AudioFifo - reads only available samples', (t) => {
  const sampleFormat = ffmpeg.constants.sampleFormats.S16
  const channels = 2
  const nbSamples = 1024
  const channelLayout = ffmpeg.constants.channelLayouts.STEREO

  using fifo = new ffmpeg.AudioFifo(sampleFormat, channels, nbSamples)

  using frame = new ffmpeg.Frame()
  frame.format = sampleFormat
  frame.nbSamples = nbSamples / 2
  frame.channelLayout = channelLayout
  frame.alloc()

  fifo.write(frame)

  using readFrame = new ffmpeg.Frame()
  readFrame.format = sampleFormat
  readFrame.nbSamples = nbSamples
  readFrame.channelLayout = channelLayout
  readFrame.alloc()

  const read = fifo.read(readFrame, nbSamples)
  t.is(read, nbSamples / 2, 'reads only the available samples')
  t.is(fifo.size, 0)
})

test('audio fifo with planar format', (t) => {
  const sampleFormat = ffmpeg.constants.sampleFormats.FLTP
  const channels = 2
  const nbSamples = 1024
  const channelLayout = ffmpeg.constants.channelLayouts.STEREO

  using fifo = new ffmpeg.AudioFifo(sampleFormat, channels, nbSamples)

  using frame = new ffmpeg.Frame()
  frame.format = sampleFormat
  frame.nbSamples = nbSamples
  frame.channelLayout = channelLayout
  frame.alloc()

  const written = fifo.write(frame)
  t.is(written, nbSamples, 'writes all samples for planar')
  t.is(fifo.size, nbSamples)

  using readFrame = new ffmpeg.Frame()
  readFrame.format = sampleFormat
  readFrame.nbSamples = nbSamples
  readFrame.channelLayout = channelLayout
  readFrame.alloc()

  const read = fifo.read(readFrame, nbSamples)
  t.is(read, nbSamples, 'reads all samples for planar')
})
