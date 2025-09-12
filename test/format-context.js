const test = require('brittle')
const ffmpeg = require('..')

const fallbackName = 'lavfi'
const fallbackURL = 'testsrc=size=640x480:rate=30'

test('InputFormatContext should be instantiate with IOContext', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  using inputFormatContext = new ffmpeg.InputFormatContext(io)

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instantiate with InputFormat', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instantiate with InputFormat', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  t.ok(inputFormatContext)
})

test('InputFormatContext.getBestStream should return a stream', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  const bestStream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  t.ok(bestStream instanceof ffmpeg.Stream)
})

test('InputFormatContext.getBestStream should return a null if no stream is found', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  const bestStream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.SUBTITLE
  )

  t.is(bestStream, null)
})

test('format context should expose bitRate accessor', (t) => {
  const io = createTestIO()
  const inputContext = new ffmpeg.InputFormatContext(io)

  t.is(typeof inputContext.bitRate, 'number')

  inputContext.bitRate = 1000000
  t.is(inputContext.bitRate, 1000000)

  inputContext.destroy()
})

test('format context should expose duration and startTime getters', (t) => {
  const io = createTestIO()
  const inputContext = new ffmpeg.InputFormatContext(io)

  t.is(typeof inputContext.duration, 'number')
  t.is(typeof inputContext.startTime, 'number')

  inputContext.destroy()
})

test('format context should expose flags accessor with safe helpers', (t) => {
  const io = createTestIO()
  const inputContext = new ffmpeg.InputFormatContext(io)

  const initialFlags = inputContext.flags
  t.is(typeof initialFlags, 'number')

  inputContext.addFlags(
    ffmpeg.constants.formatContextFlags.GENPTS |
      ffmpeg.constants.formatContextFlags.NOBUFFER
  )

  t.ok(inputContext.hasFlags(ffmpeg.constants.formatContextFlags.GENPTS))
  t.ok(inputContext.hasFlags(ffmpeg.constants.formatContextFlags.NOBUFFER))

  inputContext.removeFlags(ffmpeg.constants.formatContextFlags.NOBUFFER)

  t.ok(inputContext.hasFlags(ffmpeg.constants.formatContextFlags.GENPTS))
  t.absent(inputContext.hasFlags(ffmpeg.constants.formatContextFlags.NOBUFFER))

  t.ok(
    (inputContext.flags & initialFlags) === initialFlags,
    'initial flags preserved'
  )

  inputContext.destroy()
})

test('format context should expose metadata accessor', (t) => {
  const io = createTestIO()
  const inputContext = new ffmpeg.InputFormatContext(io)

  const metadata = inputContext.metadata
  t.ok(metadata instanceof ffmpeg.Dictionary)

  const newMetadata = ffmpeg.Dictionary.from({
    title: 'Test Video',
    artist: 'Test Artist',
    date: '2025'
  })

  inputContext.metadata = newMetadata

  const retrievedMetadata = inputContext.metadata
  t.is(retrievedMetadata.get('title'), 'Test Video')
  t.is(retrievedMetadata.get('artist'), 'Test Artist')
  t.is(retrievedMetadata.get('date'), '2025')

  metadata.destroy()
  newMetadata.destroy()
  retrievedMetadata.destroy()
  inputContext.destroy()
})

function createTestIO() {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  return new ffmpeg.IOContext(image)
}

function getOptions() {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  return options
}
