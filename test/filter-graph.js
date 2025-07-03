const test = require('brittle')
const ffmpeg = require('..')

const timeBase = new ffmpeg.Rational(1, 30)
const aspectRatio = new ffmpeg.Rational(1, 1)

test('it should expose a FilterGraph class', (t) => {
  using graph = new ffmpeg.FilterGraph(
    'null',
    1,
    1,
    ffmpeg.constants.pixelFormats.RGB24,
    timeBase,
    aspectRatio
  )

  t.ok(graph)
})

test('FilterGraph class should expose a destroy method', (t) => {
  const graph = new ffmpeg.FilterGraph(
    'null',
    1,
    1,
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
    1,
    1,
    ffmpeg.constants.pixelFormats.RGB24,
    timeBase,
    aspectRatio
  )
  using frame = createFrame()

  t.ok(typeof graph.pushFrame(frame) === 'number')
})

test('FilterGraph class should expose a pullFrame method', (t) => {
  using graph = new ffmpeg.FilterGraph(
    'negate',
    1,
    1,
    ffmpeg.constants.pixelFormats.RGB24,
    timeBase,
    aspectRatio
  )
  using frame = createFrame()
  using outputFrame = createFrame()

  graph.pushFrame(frame)

  t.ok(typeof graph.pullFrame(outputFrame) == 'number')
})

test('negate filter should actually negate RGB values in the buffer', (t) => {
  using graph = new ffmpeg.FilterGraph(
    'negate',
    1,
    1,
    ffmpeg.constants.pixelFormats.RGB24,
    timeBase,
    aspectRatio
  )

  using inputFrame = createFrame()
  const inputImage = createRedImage()
  using outputFrame = createFrame()
  inputImage.fill(inputFrame)

  t.ok(graph.pushFrame(inputFrame) >= 0)
  t.ok(graph.pullFrame(outputFrame) >= 0)

  const outputImage = new ffmpeg.Image(
    ffmpeg.constants.pixelFormats.RGB24,
    1,
    1
  )
  outputImage.read(outputFrame)

  t.ok(outputImage.data.at(0) === 0)
  t.ok(outputImage.data.at(1) === 255)
  t.ok(outputImage.data.at(2) === 255)
})

// Helpers

function createFrame(width = 1, height = 1) {
  const frame = new ffmpeg.Frame()
  frame.width = width
  frame.height = height
  frame.pixelFormat = ffmpeg.constants.pixelFormats.RGB24
  frame.alloc()
  return frame
}

function createRedImage(width = 1, height = 1) {
  const image = new ffmpeg.Image(
    ffmpeg.constants.pixelFormats.RGB24,
    width,
    height
  )

  // Fill with red pixels (255, 0, 0)
  for (let i = 0; i < image.data.length; i += 3) {
    image.data[i] = 255 // Red
    image.data[i + 1] = 0 // Green
    image.data[i + 2] = 0 // Blue
  }

  return image
}
