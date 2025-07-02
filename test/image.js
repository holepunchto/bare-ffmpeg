const test = require('brittle')
const ffmpeg = require('..')

test('Image class should expose a method for reading from frame (RGBA24)', (t) => {
  const width = 1
  const height = 1
  const format = ffmpeg.constants.pixelFormats.RGB24

  const imageA = new ffmpeg.Image(format, width, height)
  for (let i = 0; i < imageA.data.length; i += 3) {
    imageA.data[i + 0] = 50
    imageA.data[i + 1] = 100
    imageA.data[i + 2] = 150
  }

  const frame = new ffmpeg.Frame()
  frame.width = width
  frame.height = height
  frame.pixelFormat = format
  frame.alloc()
  imageA.fill(frame)

  const imageB = new ffmpeg.Image(format, width, height)
  imageB.read(frame)

  t.is(imageA.data.length, imageB.data.length, 'same data length')
  for (let i = 0; i < imageA.data.length; i++) {
    t.is(imageB.data[i], imageA.data[i], `byte ${i} matches`)
  }
})
