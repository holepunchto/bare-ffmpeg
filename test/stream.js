const test = require('brittle')
const ffmpeg = require('..')

const fallbackName = 'lavfi'
const fallbackURL = 'testsrc=size=640x480:rate=30'

test('it should expose an ID getter', (t) => {
  const stream = getStream()
  t.ok(typeof stream.id === 'number')
})

test('it should expose an ID setter', (t) => {
  const stream = getStream()
  stream.id = 1
  t.ok(stream.id === 1)
})

test('it should expose an index getter', (t) => {
  const stream = getStream()
  t.ok(typeof stream.index === 'number')
})

test('it should expose a codec getter', (t) => {
  const stream = getStream()
  t.ok(stream.codec instanceof ffmpeg.Codec)
})

test('it should expose a codec parameters getter', (t) => {
  const stream = getStream()
  t.ok(stream.codecParameters instanceof ffmpeg.CodecParameters)
})

test('it should expose a timeBase getter', (t) => {
  const stream = getStream()
  t.ok(stream.timeBase instanceof ffmpeg.Rational)
})

test('it should expose a timeBase setter', (t) => {
  const stream = getStream()
  const newTimeBase = new ffmpeg.Rational(1, 30)
  stream.timeBase = newTimeBase
  t.ok(stream.timeBase.numerator === newTimeBase.numerator)
  t.ok(stream.timeBase.denominator === newTimeBase.denominator)
})

// helpers

function getStream() {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    options,
    fallbackURL
  )

  return inputFormatContext.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
}
