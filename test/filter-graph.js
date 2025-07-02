const test = require('brittle')
const ffmpeg = require('..')

const timeBase = new ffmpeg.Rational(1, 30)
const aspectRatio = new ffmpeg.Rational(1, 1)

test('it should expose a FilterGraph class', (t) => {
  using graph = new ffmpeg.FilterGraph(
    'null',
    400,
    400,
    ffmpeg.constants.pixelFormats.RGB24,
    timeBase,
    aspectRatio
  )

  t.ok(graph)
})

test('FilterGraph class should expose a destroy method', (t) => {
  const graph = new ffmpeg.FilterGraph(
    'null',
    400,
    400,
    ffmpeg.constants.pixelFormats.RGB24,
    timeBase,
    aspectRatio
  )

  t.execution(() => {
    graph.destroy()
  })
})

test('FilterGraph class should expose a pushFrame method', (t) => {
  using graph = new ffmpeg.FilterGraph(
    'negate',
    100,
    100,
    ffmpeg.constants.pixelFormats.RGB24,
    timeBase,
    aspectRatio
  )

  // Create a test frame
  const frame = new ffmpeg.Frame()
  frame.width = 100
  frame.height = 100
  frame.pixelFormat = ffmpeg.constants.pixelFormats.RGB24
  frame.alloc()

  // Create an image with known RGB values
  const inputImage = new ffmpeg.Image(
    ffmpeg.constants.pixelFormats.RGB24,
    100,
    100
  )

  // Fill with a specific RGB pattern: red (255, 0, 0)
  for (let i = 0; i < inputImage.data.length; i += 3) {
    inputImage.data[i] = 255 // R = 255
    inputImage.data[i + 1] = 0 // G = 0
    inputImage.data[i + 2] = 0 // B = 0
  }

  // Fill the frame with our test image
  inputImage.fill(frame)

  // Push the frame to the filter graph
  t.execution(() => {
    graph.pushFrame(frame)
  })
})

test('FilterGraph class should expose a pushFrame method', (t) => {
  using graph = new ffmpeg.FilterGraph(
    'negate',
    100,
    100,
    ffmpeg.constants.pixelFormats.RGB24,
    timeBase,
    aspectRatio
  )

  // Create a test frame
  const frame = new ffmpeg.Frame()
  frame.width = 100
  frame.height = 100
  frame.pixelFormat = ffmpeg.constants.pixelFormats.RGB24
  frame.alloc()

  // Create an image with known RGB values
  const inputImage = new ffmpeg.Image(
    ffmpeg.constants.pixelFormats.RGB24,
    100,
    100
  )

  // Fill with a specific RGB pattern: red (255, 0, 0)
  for (let i = 0; i < inputImage.data.length; i += 3) {
    inputImage.data[i] = 255 // R = 255
    inputImage.data[i + 1] = 0 // G = 0
    inputImage.data[i + 2] = 0 // B = 0
  }

  // Fill the frame with our test image
  inputImage.fill(frame)

  // Push the frame to the filter graph
  t.ok(typeof graph.pushFrame(frame) === 'number')
})

test('FilterGraph class should expose a pullFrame method', (t) => {
  using graph = new ffmpeg.FilterGraph(
    'negate',
    100,
    100,
    ffmpeg.constants.pixelFormats.RGB24,
    timeBase,
    aspectRatio
  )

  // Create a test frame
  const frame = new ffmpeg.Frame()
  frame.width = 100
  frame.height = 100
  frame.pixelFormat = ffmpeg.constants.pixelFormats.RGB24
  frame.alloc()

  // Create an image with known RGB values
  const inputImage = new ffmpeg.Image(
    ffmpeg.constants.pixelFormats.RGB24,
    100,
    100
  )

  // Fill with a specific RGB pattern: red (255, 0, 0)
  for (let i = 0; i < inputImage.data.length; i += 3) {
    inputImage.data[i] = 255 // R = 255
    inputImage.data[i + 1] = 0 // G = 0
    inputImage.data[i + 2] = 0 // B = 0
  }

  // Fill the frame with our test image
  inputImage.fill(frame)

  // Push the frame to the filter graph
  graph.pushFrame(frame)

  // Pull the processed frame back
  const outputFrame = new ffmpeg.Frame()
  outputFrame.width = 100
  outputFrame.height = 100
  outputFrame.pixelFormat = ffmpeg.constants.pixelFormats.RGB24
  outputFrame.alloc()

  const pullResult = graph.pullFrame(outputFrame)
  t.ok(typeof pullResult === 'number')

  // // Create an output image to extract the processed data
  // const outputImage = new ffmpeg.Image(
  //   ffmpeg.constants.pixelFormats.RGB24,
  //   100,
  //   100
  // )
  //
  // // Extract the processed frame data
  // outputImage.fill(outputFrame)
  //
  // // Assert that RGB values have been negated!
  // // Input: red (255, 0, 0) -> Output should be: cyan (0, 255, 255)
  // const firstPixelR = outputImage.data[0]
  // const firstPixelG = outputImage.data[1]
  // const firstPixelB = outputImage.data[2]
  //
  // t.ok(firstPixelR === 0, `Red channel should be negated from 255 to 0, got ${firstPixelR}`)
  // t.ok(firstPixelG === 255, `Green channel should be negated from 0 to 255, got ${firstPixelG}`)
  // t.ok(firstPixelB === 255, `Blue channel should be negated from 0 to 255, got ${firstPixelB}`)
  //
  // // Verify the negate filter worked: red (255,0,0) -> cyan (0,255,255)
  // t.ok(
  //   firstPixelR === 0 && firstPixelG === 255 && firstPixelB === 255,
  //   `RGB values should be negated: expected (0,255,255), got (${firstPixelR},${firstPixelG},${firstPixelB})`
  // )
})
