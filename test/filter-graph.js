const test = require('brittle')
const ffmpeg = require('..')

test('it should expose a FilterGraph class', (t) => {
  using graph = new ffmpeg.FilterGraph()
  t.ok(graph)
})

test('it should expose a destroy method', (t) => {
  const graph = new ffmpeg.FilterGraph()

  t.execution(() => {
    graph.destroy()
  })
})

test('FilterGraph should expose a createFilter method', (t) => {
  using graph = new ffmpeg.FilterGraph()
  const ctx = new ffmpeg.FilterContext()
  const filter = new ffmpeg.Filter('buffer')

  const succes = graph.createFilter(ctx, filter, 'in', {
    width: 1,
    height: 1,
    pixelFormat: ffmpeg.constants.pixelFormats.RGB24,
    timeBase: new ffmpeg.Rational(1, 30),
    aspectRatio: new ffmpeg.Rational(1, 1)
  })

  t.ok(succes)
})
