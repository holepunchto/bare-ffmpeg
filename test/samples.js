const test = require('brittle')
const ffmpeg = require('..')

test('it should expose a Samples API', (t) => {
  const samples = new ffmpeg.Samples()
  t.ok(samples)
})

test('Samples sould expose a fill method', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  const len = samples.fill(audioFrame)

  t.is(typeof len, 'number')
})

test('Samples sould expose a data getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  const len = samples.fill(audioFrame)

  const data = samples.data
  t.ok(data instanceof Buffer)
  t.is(data.byteLength, len)
})

test('Samples sould expose a channelLayout getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.channelLayout, audioFrame.channelLayout)
})

test('Samples sould expose a format getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.format, audioFrame.format)
})

test('Samples sould expose a nbChannels getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.nbChannels, 2)
})

test('Samples sould expose a nbSamples getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.nbSamples, audioFrame.nbSamples)
})

test('Samples sould expose a pts getter', (t) => {
  using audioFrame = makeAudioFrame()
  const samples = new ffmpeg.Samples()

  samples.fill(audioFrame)

  t.alike(samples.pts, audioFrame.pts)
})

// Helpers

function makeAudioFrame() {
  const audioFrame = new ffmpeg.Frame()
  audioFrame.channelLayout = ffmpeg.constants.channelLayouts.STEREO
  audioFrame.format = ffmpeg.constants.sampleFormats.S16
  audioFrame.nbSamples = 1024
  return audioFrame
}
