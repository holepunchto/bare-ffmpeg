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
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)

  const inputs = initInputs(bufferSinkContext)
  const outputs = initOutputs(bufferContext)

  t.execution(() => {
    graph.parse('negate', inputs, outputs)
  })
})

test('FilterGraph.parse should throw an error if inputs are not valid', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)

  const inputs = initInputs(bufferSinkContext)
  const outputs = initOutputs(bufferContext)

  t.exception(() => {
    graph.parse('foo', inputs, outputs)
  })
})

test('FilterGraph should expose a configure method', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)

  const inputs = initInputs(bufferSinkContext)
  const outputs = initOutputs(bufferContext)

  graph.parse('negate', inputs, outputs)

  t.execution(() => {
    graph.configure()
  })
})

test('FilterGraph.configure should throw when parameters are not valid', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)

  const inputs = initInputs(bufferSinkContext)
  const outputs = new ffmpeg.FilterInOut()

  graph.parse('negate', inputs, outputs)

  t.plan(1)
  t.exception(() => {
    graph.configure()
  })
})

// Helpers

function initGraph(bufferContext, bufferSinkContext) {
  const graph = new ffmpeg.FilterGraph()
  const buffer = new ffmpeg.Filter('buffer')
  const bufferSink = new ffmpeg.Filter('buffersink')

  graph.createFilter(bufferContext, buffer, 'in', {
    width: 1,
    height: 1,
    pixelFormat: ffmpeg.constants.pixelFormats.RGB24,
    timeBase: new ffmpeg.Rational(1, 30),
    aspectRatio: new ffmpeg.Rational(1, 1)
  })
  graph.createFilter(bufferSinkContext, bufferSink, 'out')

  return graph
}

function initInputs(ctx) {
  const inputs = new ffmpeg.FilterInOut()
  inputs.name = 'out'
  inputs.filterContext = ctx
  inputs.padIdx = 0
  return inputs
}

function initOutputs(ctx) {
  const outputs = new ffmpeg.FilterInOut()
  outputs.name = 'in'
  outputs.filterContext = ctx
  outputs.padIdx = 0
  return outputs
}
