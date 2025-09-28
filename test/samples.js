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
  using sourceFrame = makeAudioFrame()
  const samplesA = new ffmpeg.Samples()
  const len = samplesA.fill(sourceFrame)

  const view = new Int16Array(
    samplesA.data.buffer,
    samplesA.data.byteOffset,
    len / 2
  )
  for (let i = 0; i < view.length; i++) {
    view[i] = (i * 13) % 32768
  }

  const samplesB = new ffmpeg.Samples()
  using scratchFrame = makeAudioFrame()
  samplesB.fill(scratchFrame)
  samplesB.data.fill(0)

  samplesB.read(sourceFrame)

  t.is(samplesB.data.length, samplesA.data.length, 'same byte length')
  for (let i = 0; i < view.length; i++) {
    if (samplesB.data.readInt16LE(i * 2) !== samplesA.data.readInt16LE(i * 2)) {
      t.fail('data does not match')
    }
  }
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

test('Samples should expose bufferSize static method', (t) => {
  using audioFrame = makeAudioFrame()

  const len = ffmpeg.Samples.bufferSize(
    audioFrame.format,
    2,
    audioFrame.nbSamples
  )

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
