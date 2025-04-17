const test = require('brittle')
const ffmpeg = require('..')

test('InputFormatContext should be instanciate with IOContext', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  const inputFormatContext = new ffmpeg.InputFormatContext(io)

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instanciate with InputFormat', (t) => {
  const inputFormat = new ffmpeg.InputFormat()
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')

  const inputFormatContext = new ffmpeg.InputFormatContext(inputFormat, options)

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instanciate with InputFormat', (t) => {
  const inputFormat = new ffmpeg.InputFormat()
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  const inputFormatContext = new ffmpeg.InputFormatContext(inputFormat, options)

  const bestStream = inputFormatContext.getBestStream()

  t.ok(bestStream instanceof ffmpeg.Stream)
})
