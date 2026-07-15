const test = require('brittle')
const ffmpeg = require('..')

test('it should expose a Samples API', (t) => {
  const samples = new ffmpeg.Samples()
  t.ok(samples)
})

test('Samples should expose a fill method', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  const len = samples.fill(audioFrame)

  t.is(typeof len, 'number')
})

test('Samples.read copies PCM data back out of a frame', (t) => {
  using frameA = makeAudioFrame()
  const samplesA = new ffmpeg.Samples()
  const len = samplesA.fill(frameA)

  const view = new Int16Array(samplesA.data.buffer, samplesA.data.byteOffset, len / 2)
  for (let i = 0; i < view.length; i++) {
    view[i] = (i * 13) % 32768
  }

  const samplesB = new ffmpeg.Samples()
  using frameB = makeAudioFrame()
  samplesB.fill(frameB)
  samplesB.read(frameA)
  t.alike(samplesB.data, samplesA.data)
})

test('Samples should expose a data getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  const len = samples.fill(audioFrame)

  const data = samples.data
  t.ok(data instanceof Buffer)
  t.is(data.byteLength, len)
})

test('Samples should expose a channelLayout getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.channelLayout, audioFrame.channelLayout)
})

test('Samples should expose a format getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.format, audioFrame.format)
})

test('Samples should expose a nbChannels getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.nbChannels, 2)
})

test('Samples should expose a nbSamples getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.nbSamples, audioFrame.nbSamples)
})

test('Samples should expose a pts getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.pts, audioFrame.pts)
})

test('Samples.copy copies data between buffers', (t) => {
  using sourceFrame = makeAudioFrame()
  using targetFrame = makeAudioFrame()

  const source = new ffmpeg.Samples()
  const target = new ffmpeg.Samples()

  const len = source.fill(sourceFrame)
  target.fill(targetFrame)

  const view = new Int16Array(
    source.data.buffer,
    source.data.byteOffset,
    len / Int16Array.BYTES_PER_ELEMENT
  )

  for (let i = 0; i < view.length; i++) {
    view[i] = (i * 11) % 32768
  }

  source.copy(targetFrame)

  t.alike(target.data, source.data)
})

test('Samples should expose bufferSize static method', (t) => {
  using audioFrame = makeAudioFrame()

  const len = ffmpeg.Samples.bufferSize(audioFrame.format, 2, audioFrame.nbSamples)

  t.is(len, 4096)
})

// Helpers

function makeAudioFrame() {
  const audioFrame = new ffmpeg.Frame()
  audioFrame.channelLayout = ffmpeg.constants.channelLayouts.STEREO
  audioFrame.format = ffmpeg.constants.sampleFormats.S16
  audioFrame.nbSamples = 1024
  return audioFrame
}
