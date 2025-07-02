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
