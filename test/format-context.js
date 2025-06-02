const test = require('brittle')
const ffmpeg = require('..')

let fallbackName
let fallbackURL

if (Bare.platform == 'linux' || Bare.platform == 'win32') {
  fallbackName = 'lavfi'
  fallbackURL = 'testsrc=size=640x480:rate=30'
}

test('InputFormatContext should be instantiate with IOContext', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  const inputFormatContext = new ffmpeg.InputFormatContext(io)
  t.teardown(() => inputFormatContext.destroy())

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instantiate with InputFormat', (t) => {
  const inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )
  t.teardown(() => inputFormatContext.destroy())

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instantiate with InputFormat', (t) => {
  const inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )
  t.teardown(() => inputFormatContext.destroy())

  t.ok(inputFormatContext)
})

test('InputFormatContext.getBestStream should return a stream', (t) => {
  const inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )
  t.teardown(() => inputFormatContext.destroy())

  const bestStream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  t.ok(bestStream instanceof ffmpeg.Stream)
})

test('InputFormatContext.getBestStream should return a null if no stream is found', (t) => {
  const inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )
  t.teardown(() => inputFormatContext.destroy())

  const bestStream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.SUBTITLE
  )

  t.is(bestStream, null)
})

function getOptions() {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  return options
}
