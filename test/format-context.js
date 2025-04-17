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
  const inputFormatContext = new ffmpeg.InputFormatContext(inputFormat)
  t.ok(inputFormatContext)
})
