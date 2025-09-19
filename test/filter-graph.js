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

  t.execution(() => {
    graph.createFilter(ctx, filter, 'in', {
      width: 1,
      height: 1,
      pixelFormat: ffmpeg.constants.pixelFormats.RGB24,
      timeBase: new ffmpeg.Rational(1, 30),
      aspectRatio: new ffmpeg.Rational(1, 1)
    })
  })
})

test('FilterGraph.createFilter could be called with an undefined args', (t) => {
  using graph = new ffmpeg.FilterGraph()
  const ctx = new ffmpeg.FilterContext()
  const filter = new ffmpeg.Filter('buffersink')

  t.execution(() => {
    graph.createFilter(ctx, filter, 'out')
  })
})

test('FilterGraph.createFilter should throw an error if inputs are not valid', (t) => {
  using graph = new ffmpeg.FilterGraph()
  const ctx = new ffmpeg.FilterContext()
  const filter = new ffmpeg.Filter('buffer')
  const missingArgs = undefined

  t.exception(() => {
    graph.createFilter(ctx, filter, 'in', missingArgs)
  })
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

test('FilterGraph should expose a pushFrame method', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)
  const inputs = initInputs(bufferSinkContext)
  const outputs = initOutputs(bufferContext)

  graph.parse('negate', inputs, outputs)
  graph.configure()

  using inputFrame = createFrame()
  t.ok(graph.pushFrame(bufferContext, inputFrame) >= 0)
})

test('FilterGraph should expose a pullFrame method', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)
  const inputs = initInputs(bufferSinkContext)
  const outputs = initOutputs(bufferContext)

  graph.parse('negate', inputs, outputs)
  graph.configure()

  using inputFrame = createFrame()
  const redImage = createRedImage()
  redImage.fill(inputFrame)
  graph.pushFrame(bufferContext, inputFrame)

  using outputFrame = createFrame()
  t.ok(graph.pullFrame(bufferSinkContext, outputFrame) >= 0)
})

test('negate pixel (functional test)', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)
  const inputs = initInputs(bufferSinkContext)
  const outputs = initOutputs(bufferContext)

  graph.parse('negate', inputs, outputs)
  graph.configure()

  using inputFrame = createFrame()
  const redImage = createRedImage()
  redImage.fill(inputFrame)
  graph.pushFrame(bufferContext, inputFrame)

  using outputFrame = createFrame()
  graph.pullFrame(bufferSinkContext, outputFrame)
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

function createFrame(width = 1, height = 1) {
  const frame = new ffmpeg.Frame()
  frame.width = width
  frame.height = height
  frame.format = ffmpeg.constants.pixelFormats.RGB24
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
