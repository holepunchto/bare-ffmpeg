const test = require('brittle')
const ffmpeg = require('..')

let inputFormatContext
let codecParam

test.hook('setup', () => {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat('lavfi'),
    options,
    'testsrc=size=640x480:rate=30'
  )
  const stream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  codecParam = stream.codecParameters
})

test('CodecParameters class should expose a codecTag getter', (t) => {
  t.ok(typeof codecParam.codecTag === 'number')
})

test('CodecParameters class should expose a codecType getter', (t) => {
  t.ok(typeof codecParam.codecType === 'number')
})

test('CodecParameters class should expose a codecTag setter', (t) => {
  codecParam.codecTag = ffmpeg.constants.tags.H264
  t.ok(codecParam.codecTag === ffmpeg.constants.tags.H264)
})

test('CodecParameters class should expose a codecId getter', (t) => {
  t.ok(typeof codecParam.codecId === 'number')
})

test('CodecParameters class should expose a codecId setter', (t) => {
  codecParam.codecId = ffmpeg.constants.codecs.H264
  t.ok(codecParam.codecId === ffmpeg.constants.codecs.H264)
})

test('CodecParameters class should expose a bitRate getter', (t) => {
  t.ok(typeof codecParam.bitRate === 'number')
})

test('CodecParameters class should expose a bitsPerCodedSample getter', (t) => {
  t.ok(typeof codecParam.bitsPerCodedSample === 'number')
})

test('CodecParameters class should expose a bitsPerRawSample getter', (t) => {
  t.ok(typeof codecParam.bitsPerRawSample === 'number')
})

test('CodecParameters class should expose a codecLevel getter', (t) => {
  t.ok(typeof codecParam.codecLevel === 'number')
})

test('CodecParameters class should expose a codecProfile getter', (t) => {
  t.ok(typeof codecParam.codecProfile === 'number')
})

test('CodecParameters class should expose a codecProfile setter', (t) => {
  codecParam.codecProfile = ffmpeg.constants.profiles.H264_MAIN
  t.ok(codecParam.codecProfile === ffmpeg.constants.profiles.H264_MAIN)
})

test('CodecParameters class should expose a codecFormat getter', (t) => {
  t.ok(typeof codecParam.codecFormat === 'number')
})

test('CodecParameters class should expose a extraData getter', (t) => {
  t.ok(codecParam.extraData instanceof Buffer)
})

test('CodecParameters class should expose a extraData setter', (t) => {
  const buf = Buffer.from('test')
  codecParam.extraData = buf

  t.ok(codecParam.extraData[0] == 't'.charCodeAt(0))
  t.ok(codecParam.extraData[1] == 'e'.charCodeAt(0))
  t.ok(codecParam.extraData[2] == 's'.charCodeAt(0))
  t.ok(codecParam.extraData[3] == 't'.charCodeAt(0))
})

test.hook('teardown', () => {
  inputFormatContext.destroy()
})
