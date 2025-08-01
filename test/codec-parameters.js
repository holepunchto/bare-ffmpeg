const test = require('brittle')
const ffmpeg = require('..')

test('CodecParameters class should expose a extraData', (t) => {
  const codecParam = getCodecParameters()

  t.ok(codecParam.extraData instanceof Buffer) 
})

// Helpers

function getCodecParameters() {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  const inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options,
    'testsrc=size=640x480:rate=30'
  )
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  return stream.codecParameters
}
