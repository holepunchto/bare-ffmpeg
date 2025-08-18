const test = require('brittle')
const ffmpeg = require('..')

test('Image class should expose a method for reading from frame which handle RGBA24', (t) => {
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
  frame.format = format
  frame.alloc()
  imageA.fill(frame)

  const imageB = new ffmpeg.Image(format, width, height)
  imageB.read(frame)

  t.is(imageA.data.length, imageB.data.length, 'same data length')
  for (let i = 0; i < imageA.data.length; i++) {
    t.is(imageB.data[i], imageA.data[i], `byte ${i} matches`)
  }
})

test('Image class should expose a method for reading from frame which handle YUV420P', (t) => {
  const width = 1
  const height = 1
  const format = ffmpeg.constants.pixelFormats.YUV420P

  const imageA = new ffmpeg.Image(format, width, height)
  addFakeYUVData(imageA)

  const frame = new ffmpeg.Frame()
  frame.width = width
  frame.height = height
  frame.format = format
  frame.alloc()
  imageA.fill(frame)

  const imageB = new ffmpeg.Image(format, width, height)
  imageB.read(frame)

  t.is(imageA.data.length, imageB.data.length, 'same buffer length')

  for (let i = 0; i < imageA.data.length; i++) {
    t.is(imageB.data[i], imageA.data[i], `byte ${i} matches`)
  }
})

// Helpers

function addFakeYUVData(image) {
  // Compute the number of pixels in the Y (luma) plane
  const ySize = image.width * image.height

  // Fill Y plane with a repeating brightness pattern from 0 to 255
  for (let i = 0; i < ySize; i++) {
    image.data[i] = i % 256
  }

  // Compute the size of U and V planes (each is 1/4th of Y plane)
  const uvSize = ySize >> 2 // Equivalent to (width / 2) * (height / 2)

  // Fill U plane (after Y) with a constant value (128 = neutral chroma)
  for (let i = 0; i < uvSize; i++) {
    image.data[ySize + i] = 128
  }

  // Fill V plane (after Y + U) with a different constant (64 = visible tint)
  for (let i = 0; i < uvSize; i++) {
    image.data[ySize + uvSize + i] = 64
  }
}
