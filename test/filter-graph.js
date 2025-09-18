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

test('FilterGraph.createFilter could be called with an undefined args', (t) => {
  using graph = new ffmpeg.FilterGraph()
  const ctx = new ffmpeg.FilterContext()
  const filter = new ffmpeg.Filter('buffersink')

  const succes = graph.createFilter(ctx, filter, 'out')

  t.ok(succes)
})

test('FilterGraph should expose a parse method', (t) => {
  using graph = new ffmpeg.FilterGraph()
  const bufferContext = new ffmpeg.FilterContext()
  const buffer = new ffmpeg.Filter('buffer')
  const bufferSinkContext = new ffmpeg.FilterContext()
  const bufferSink = new ffmpeg.Filter('buffersink')

  graph.createFilter(bufferContext, buffer, 'in', {
    width: 1,
    height: 1,
    pixelFormat: ffmpeg.constants.pixelFormats.RGB24,
    timeBase: new ffmpeg.Rational(1, 30),
    aspectRatio: new ffmpeg.Rational(1, 1)
  })
  graph.createFilter(bufferSinkContext, bufferSink, 'out')

  const inputs = new ffmpeg.FilterInOut()
  inputs.name = 'out'
  inputs.filterContext = bufferSinkContext
  inputs.padIdx = 0

  const outputs = new ffmpeg.FilterInOut()
  inputs.name = 'int'
  inputs.filterContext = bufferContext
  inputs.padIdx = 0

  const succes = graph.parse('negate', inputs, outputs)

  t.ok(succes)
})
