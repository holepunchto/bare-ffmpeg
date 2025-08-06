const test = require('brittle')
const ffmpeg = require('..')

test('CodecParameters class should expose a codecTag getter', (t) => {
  const codecParam = getCodecParameters()

  t.ok(typeof codecParam.codecTag === 'number')
})

test('CodecParameters class should expose a codecType getter', (t) => {
  const codecParam = getCodecParameters()

  t.ok(typeof codecParam.codecType === 'number')
})

test('CodecParameters class should expose a codecId getter', (t) => {
  const codecParam = getCodecParameters()

  t.ok(typeof codecParam.codecId === 'number')
})

test('CodecParameters class should expose a extraData getter', (t) => {
  const codecParam = getCodecParameters()

  t.ok(codecParam.extraData instanceof Buffer)
})

test('CodecParameters class should expose a extraData setter', (t) => {
  const codecParam = getCodecParameters()

  const buf = Buffer.from('test')
  codecParam.extraData = buf

  t.ok(codecParam.extraData[0] == 't'.charCodeAt(0))
  t.ok(codecParam.extraData[1] == 'e'.charCodeAt(0))
  t.ok(codecParam.extraData[2] == 's'.charCodeAt(0))
  t.ok(codecParam.extraData[3] == 't'.charCodeAt(0))
})

// Helpers

function getCodecParameters() {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options,
    'testsrc=size=640x480:rate=30'
  )
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  return stream.codecParameters
}
