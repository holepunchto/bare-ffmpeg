const test = require('brittle')
const ffmpeg = require('..')

test('InputFormatContext should expose probesize accessor', (t) => {
  const io = createTestIO()
  const inputContext = new ffmpeg.InputFormatContext(io)

  const defaultProbesize = inputContext.probesize
  t.is(typeof defaultProbesize, 'number')

  inputContext.probesize = 5000000
  t.is(inputContext.probesize, 5000000)

  inputContext.destroy()
})

test('InputFormatContext should expose maxAnalyzeDuration accessor', (t) => {
  const io = createTestIO()
  const inputContext = new ffmpeg.InputFormatContext(io)

  const defaultDuration = inputContext.maxAnalyzeDuration
  t.is(typeof defaultDuration, 'number')

  inputContext.maxAnalyzeDuration = 10000000
  t.is(inputContext.maxAnalyzeDuration, 10000000)

  inputContext.destroy()
})

test('InputFormatContext should expose fpsProbeSize accessor', (t) => {
  const io = createTestIO()
  const inputContext = new ffmpeg.InputFormatContext(io)

  const defaultSize = inputContext.fpsProbeSize
  t.is(typeof defaultSize, 'number')

  inputContext.fpsProbeSize = 100
  t.is(inputContext.fpsProbeSize, 100)

  inputContext.destroy()
})

test('InputFormatContext properties should affect demuxing behavior', (t) => {
  const io = createTestIO()
  const inputContext = new ffmpeg.InputFormatContext(io)

  inputContext.probesize = 1000000
  inputContext.maxAnalyzeDuration = 5000000
  inputContext.fpsProbeSize = 50
  inputContext.addFlags(
    ffmpeg.constants.formatContextFlags.GENPTS |
      ffmpeg.constants.formatContextFlags.FAST_SEEK
  )

  t.is(inputContext.probesize, 1000000)
  t.is(inputContext.maxAnalyzeDuration, 5000000)
  t.is(inputContext.fpsProbeSize, 50)
  t.ok(inputContext.flags & ffmpeg.constants.formatContextFlags.GENPTS)
  t.ok(inputContext.flags & ffmpeg.constants.formatContextFlags.FAST_SEEK)

  inputContext.destroy()
})

function createTestIO() {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  return new ffmpeg.IOContext(image)
}
