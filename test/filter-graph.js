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
