const test = require('brittle')
const ffmpeg = require('..')

let fallbackName
let fallbackURL

// TODO: win32?
if (Bare.platform == 'linux') {
  fallbackName = 'lavfi'
  fallbackURL = 'testsrc=size=640x480:rate=30'
}

test('InputFormatContext should be instanciate with IOContext', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  const inputFormatContext = new ffmpeg.InputFormatContext(io)

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instanciate with InputFormat', (t) => {
  const inputFormat = new ffmpeg.InputFormat(fallbackName)
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')

  const inputFormatContext = new ffmpeg.InputFormatContext(
    inputFormat,
    options,
    fallbackURL
  )

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instanciate with InputFormat', (t) => {
  const inputFormat = new ffmpeg.InputFormat(fallbackName)
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  const inputFormatContext = new ffmpeg.InputFormatContext(
    inputFormat,
    options,
    fallbackURL
  )

  const bestStream = inputFormatContext.getBestStream()

  t.ok(bestStream instanceof ffmpeg.Stream)
})
