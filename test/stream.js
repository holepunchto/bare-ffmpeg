const test = require('brittle')
const ffmpeg = require('..')

test('it should expose an ID getter', (t) => {
  using inputFormatContext = getInputFormatContext()
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  t.ok(typeof stream.id === 'number')
})

test('it should expose an ID setter', (t) => {
  using inputFormatContext = getInputFormatContext()
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  stream.id = 1
  t.ok(stream.id === 1)
})

test('it should expose an index getter', (t) => {
  using inputFormatContext = getInputFormatContext()
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  t.ok(typeof stream.index === 'number')
})

test('it should expose a codec getter', (t) => {
  using inputFormatContext = getInputFormatContext()
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  t.ok(stream.codec instanceof ffmpeg.Codec)
})

test('it should expose a codec parameters getter', (t) => {
  using inputFormatContext = getInputFormatContext()
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  t.ok(stream.codecParameters instanceof ffmpeg.CodecParameters)
})

test('it should expose a timeBase getter', (t) => {
  using inputFormatContext = getInputFormatContext()
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  t.ok(stream.timeBase instanceof ffmpeg.Rational)
})

test('it should expose a timeBase setter', (t) => {
  using inputFormatContext = getInputFormatContext()
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  const newTimeBase = new ffmpeg.Rational(1, 30)
  stream.timeBase = newTimeBase
  t.ok(stream.timeBase.numerator === newTimeBase.numerator)
  t.ok(stream.timeBase.denominator === newTimeBase.denominator)
})

// Helpers

function getInputFormatContext() {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  return new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options,
    'testsrc=size=640x480:rate=30'
  )
}
