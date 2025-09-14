const test = require('brittle')
const ffmpeg = require('..')

const fallbackName = 'lavfi'
const fallbackURL = 'testsrc=size=640x480:rate=30'

test('InputFormatContext should be instantiate with IOContext', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  using inputFormatContext = new ffmpeg.InputFormatContext(io)

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instantiate with InputFormat', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  t.ok(inputFormatContext)
})

test('InputFormatContext should be instantiate with InputFormat', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  t.ok(inputFormatContext)
})

test('InputFormatContext.getBestStream should return a stream', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  const bestStream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.VIDEO
  )

  t.ok(bestStream instanceof ffmpeg.Stream)
})

test('InputFormatContext.getBestStream should return a null if no stream is found', (t) => {
  using inputFormatContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(fallbackName),
    getOptions(),
    fallbackURL
  )

  const bestStream = inputFormatContext.getBestStream(
    ffmpeg.constants.mediaTypes.SUBTITLE
  )

  t.is(bestStream, null)
})

test('FormatContext - setOption/getOption with string value', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  using formatContext = new ffmpeg.InputFormatContext(io)

  formatContext.setOption('analyzeduration', '5000000')
  const value = formatContext.getOption('analyzeduration')
  t.is(value, '5000000', 'should get option value as string')
})

test('FormatContext - setOptionInt/getOptionInt', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  using formatContext = new ffmpeg.InputFormatContext(io)

  formatContext.setOptionInt('probesize', 1000000)
  const value = formatContext.getOptionInt('probesize')
  t.is(value, 1000000, 'should get integer option value')
})

test('FormatContext - setOptionDouble/getOptionDouble', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  using formatContext = new ffmpeg.InputFormatContext(io)

  formatContext.setOptionDouble('start_time_realtime', 1234567.29)
  const value = formatContext.getOptionDouble('start_time_realtime')
  // ffmpeg rounds to nearest integer
  t.is(value, 1234567, 'should get double option value')
})

test('FormatContext - setOptionBinary/getOptionBinary', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  using formatContext = new ffmpeg.InputFormatContext(io)

  const testData = Buffer.from([0x01, 0x02, 0x03, 0x04])
  formatContext.setOptionBinary('cryptokey', testData)
  const value = formatContext.getOptionBinary('cryptokey')
  t.alike(value, testData, 'should get binary option value')
})

test('OutputFormatContext - setOption/getOption with movflags', (t) => {
  const buffer = Buffer.alloc(1024 * 1024)
  const io = new ffmpeg.IOContext(buffer, {
    onwrite: (buffer) => buffer.length,
    onseek: (offset, whence) => {
      if (whence === ffmpeg.constants.seek.SIZE) return buffer.length
      return offset
    }
  })

  using formatContext = new ffmpeg.OutputFormatContext('mp4', io)

  formatContext.setOption('movflags', 'frag_keyframe+empty_moov')
  const value = formatContext.getOption('movflags')
  t.ok(value, 'should get movflags option value')
})

test('FormatContext - invalid option should throw', (t) => {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)

  using formatContext = new ffmpeg.InputFormatContext(io)

  t.exception(() => {
    formatContext.setOption('invalid_option_name_that_does_not_exist', 'value')
  }, /Option not found/)
})

function getOptions() {
  const options = new ffmpeg.Dictionary()
  options.set('framerate', '30')
  options.set('video_size', '1280x720')
  options.set('pixel_format', 'uyvy422')
  return options
}
