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

test('CodecParameters class should expose a tag getter', (t) => {
  t.ok(typeof codecParam.tag === 'number')
})

test('CodecParameters class should expose a tag setter', (t) => {
  codecParam.tag = ffmpeg.constants.tags.H264
  t.ok(codecParam.tag === ffmpeg.constants.tags.H264)
})

test('CodecParameters class should expose a type getter', (t) => {
  t.ok(codecParam.type === ffmpeg.constants.mediaTypes.VIDEO)
})

test('CodecParameters class should expose a type setter', (t) => {
  codecParam.type = ffmpeg.constants.mediaTypes.UNKNOWN
  t.ok(codecParam.type === ffmpeg.constants.mediaTypes.UNKNOWN)
})

test('CodecParameters class should expose a id getter', (t) => {
  t.ok(typeof codecParam.id === 'number')
})

test('CodecParameters class should expose a id setter', (t) => {
  codecParam.id = ffmpeg.constants.codecs.H264
  t.ok(codecParam.id === ffmpeg.constants.codecs.H264)
})

test('CodecParameters class should expose a level getter', (t) => {
  t.ok(codecParam.level === ffmpeg.constants.levels.UNKNOWN)
})

test('CodecParameters class should expose a level setter', (t) => {
  // Note: FFmpeg does not expose levels
  // https://github.com/FFmpeg/FFmpeg/blob/fa458c7243a5462726a6929034f28c14d111c684/libavcodec/defs.h#L206
  codecParam.level = 1
  t.ok(codecParam.level === 1)
})

test('CodecParameters class should expose a profile getter', (t) => {
  t.ok(typeof codecParam.profile === 'number')
})

test('CodecParameters class should expose a profile setter', (t) => {
  codecParam.profile = ffmpeg.constants.profiles.H264_MAIN
  t.ok(codecParam.profile === ffmpeg.constants.profiles.H264_MAIN)
})

test('CodecParameters class should expose a format getter', (t) => {
  t.ok(typeof codecParam.format === 'number')
})

test('CodecParameters class should expose a format setter', (t) => {
  codecParam.format = ffmpeg.constants.pixelFormats.RGBA
  t.ok(codecParam.format === ffmpeg.constants.pixelFormats.RGBA)
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

test('CodecParameters class should expose bitRate getter', (t) => {
  t.ok(typeof codecParam.bitRate === 'number')
})

test('CodecParameters class should expose a bitRate setter', (t) => {
  codecParam.format = 64000
  t.ok(codecParam.format === 64000)
})

test('CodecParameters class should expose a bitsPerCodedSample getter', (t) => {
  t.ok(typeof codecParam.bitsPerCodedSample === 'number')
})

test('CodecParameters class should expose a bitsPerCodedSample setter', (t) => {
  codecParam.bitsPerCodedSample = 8
  t.ok(codecParam.bitsPerCodedSample === 8)
})

test('CodecParameters class should expose a bitsPerRawSample getter', (t) => {
  t.ok(typeof codecParam.bitsPerRawSample === 'number')
})

test('CodecParameters class should expose a bitsPerRawSample setter', (t) => {
  codecParam.bitsPerRawSample = 24
  t.ok(codecParam.bitsPerRawSample === 24)
})

test('CodecParameters class should expose a sampleRate getter', (t) => {
  t.ok(typeof codecParam.sampleRate === 'number')
})

test('CodecParameters class should expose a sampleRate setter', (t) => {
  codecParam.sampleRate = 48000
  t.ok(codecParam.sampleRate === 48000)
})

test('CodecParameters class should expose a frameRate getter', (t) => {
  t.ok(codecParam.frameRate instanceof ffmpeg.Rational)
  t.ok(typeof codecParam.frameRate.numerator === 'number')
  t.ok(typeof codecParam.frameRate.denominator === 'number')
})

test('CodecParameters class should expose a frameRate setter', (t) => {
  codecParam.frameRate = new ffmpeg.Rational(24, 1)
  t.ok(codecParam.frameRate.numerator === 24)
  t.ok(codecParam.frameRate.denominator === 1)
})

test('CodecParameters class should expose a nbChannels getter', (t) => {
  t.ok(typeof codecParam.nbChannels === 'number')
})

test('CodecParameters class should expose a nbChannels setter', (t) => {
  codecParam.nbChannels = 6
  t.ok(codecParam.nbChannels === 6)
})

test('CodecParameters class should expose a width getter', (t) => {
  t.ok(typeof codecParam.width === 'number')
})

test('CodecParameters class should expose a width setter', (t) => {
  codecParam.width = 1920
  t.ok(codecParam.width === 1920)
})

test('CodecParameters class should expose a height getter', (t) => {
  t.ok(typeof codecParam.height === 'number')
})

test('CodecParameters class should expose a height setter', (t) => {
  codecParam.height = 1080
  t.ok(codecParam.height === 1080)
})

test('CodecParameters class should expose a channelLayout getter', (t) => {
  t.ok(codecParam.channelLayout instanceof ffmpeg.ChannelLayout)
  t.is(codecParam.channelLayout.mask, 0)
  t.is(codecParam.channelLayout.nbChannels, 6)
})

test('CodecParameters class should expose a channelLayout setter', (t) => {
  codecParam.channelLayout = ffmpeg.constants.channelLayouts.STEREO
  t.is(codecParam.channelLayout.mask, 3)
  t.is(codecParam.channelLayout.nbChannels, 2)
})

test('CodecParameters class should expose a blockAlign getter', (t) => {
  t.ok(typeof codecParam.blockAlign === 'number')
})

test('CodecParameters class should expose a blockAlign setter', (t) => {
  codecParam.blockAlign = 4
  t.ok(codecParam.blockAlign === 4)
})

test.hook('teardown', () => {
  inputFormatContext.destroy()
})
