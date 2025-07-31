const test = require('brittle')
const ffmpeg = require('..')

const fallbackName = 'lavfi'
const fallbackURL = 'testsrc=size=640x480:rate=30'

test('InputFormatContext should be instantiate with IOContext', (t) => {
  using inputFormatContext = getInputFormatContext('jpeg')

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

test('InputFormatContext should expose a duration getter', (t) => {
  using imageFormatContext = getInputFormatContext('jpeg')
  using aiffFormatContext = getInputFormatContext('aiff')
  using mp3FormatContext = getInputFormatContext('mp3')

  t.is(imageFormatContext.duration, 0)
  t.is(aiffFormatContext.duration, 2936625)
  t.is(mp3FormatContext.duration, 0)
})

test('InputFormatContext should expose a inputFormat getter', (t) => {
  using context = getInputFormatContext('jpeg')

  t.ok(context.inputFormat)
})

function getOptions() {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  return options
}

function getInputFormatContext(ext) {
  const extMap = {
    jpeg: 'image/sample.jpeg',
    aiff: 'audio/sample.aiff',
    mp3: 'audio/sample.mp3'
  }

  const media = require('./fixtures/' + extMap[ext], {
    with: { type: 'binary' }
  })

  const io = new ffmpeg.IOContext(media)
  return new ffmpeg.InputFormatContext(io)
}
