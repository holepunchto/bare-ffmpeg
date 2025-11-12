const test = require('brittle')
const ffmpeg = require('..')

const fallbackName = 'lavfi'
const fallbackURL = 'testsrc=size=640x480:rate=30'

// InputFormatContext

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

  const bestStream = inputFormatContext.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)

  t.ok(bestStream instanceof ffmpeg.Stream)
})

test('InputFormatContext.getBestStream should return a null if no stream is found', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  const bestStream = inputFormatContext.getBestStream(ffmpeg.constants.mediaTypes.SUBTITLE)

  t.is(bestStream, null)
})

test('InputFormatContext.inputFormat should expose a inputFormat getter', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  const inputFormat = inputFormatContext.inputFormat

  t.ok(inputFormat instanceof ffmpeg.InputFormat)
})

// OutputFormatContext

test('OutputFormatContext should expose an outputFormat getter', (t) => {
  const io = new ffmpeg.IOContext(4096)
  const outContext = new ffmpeg.OutputFormatContext(new ffmpeg.OutputFormat('webm'), io)

  const outputFormat = outContext.outputFormat

  t.ok(outputFormat instanceof ffmpeg.OutputFormat)
})

// Helpers

function getOptions() {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  return options
}
