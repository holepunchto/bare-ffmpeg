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

  const frame = createFrame()

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
  const frame = createFrame()
  const outputFrame = createFrame()

  graph.pushFrame(frame)

  t.ok(typeof graph.pullFrame(outputFrame) == 'number')
})

// Helpers

function createFrame(width = 100, height = 100) {
  const frame= new ffmpeg.Frame()
  frame.width = width
  frame.height = height
  frame.pixelFormat = ffmpeg.constants.pixelFormats.RGB24
  frame.alloc()
  return frame;
}
