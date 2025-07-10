
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

  return inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )
}

