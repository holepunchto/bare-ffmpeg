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
    graph.createFilter(
      ctx,
      filter,
      'in',
      'video_size=1x1:pix_fmt=2:time_base=1/30:pixel_aspect=1/1'
    )
  })
})

test('FilterGraph.createFilter could be called with null/undefined args', (t) => {
  using graph = new ffmpeg.FilterGraph()
  const ctx = new ffmpeg.FilterContext()
  const filter = new ffmpeg.Filter('buffersink')

  t.execution(() => {
    graph.createFilter(ctx, filter, 'out')
  })

  t.execution(() => {
    graph.createFilter(ctx, filter, 'out', null)
  })

  t.execution(() => {
    graph.createFilter(ctx, filter, 'out', undefined)
  })
})

test('FilterGraph.createFilter should work with audio filters', (t) => {
  using graph = new ffmpeg.FilterGraph()
  const ctx = new ffmpeg.FilterContext()
  const filter = new ffmpeg.Filter('abuffer')

  t.execution(() => {
    graph.createFilter(
      ctx,
      filter,
      'ain',
      'sample_rate=48000:sample_fmt=s16:channel_layout=mono:time_base=1/48000'
    )
  })
})

test('FilterGraph should expose a parse method', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)

  using inputs = initInputs(bufferSinkContext)
  using outputs = initOutputs(bufferContext)

  t.execution(() => {
    graph.parse('negate', inputs, outputs)
  })
})

test('FilterGraph.parse should handle multiple inputs', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const sinkContext0 = new ffmpeg.FilterContext()
  const sinkContext1 = new ffmpeg.FilterContext()
  using graph = new ffmpeg.FilterGraph()
  const buffer = new ffmpeg.Filter('buffer')
  const sink0 = new ffmpeg.Filter('buffersink')
  const sink1 = new ffmpeg.Filter('buffersink')
  const args = `video_size=1x1:pix_fmt=${ffmpeg.constants.pixelFormats.RGB24}:time_base=1/30:pixel_aspect=1/1`

  graph.createFilter(bufferContext, buffer, 'in', args)
  graph.createFilter(sinkContext0, sink0, 'out0')
  graph.createFilter(sinkContext1, sink1, 'out1')

  using inputs = createFilterInOutChain([
    [sinkContext0, 'out0'],
    [sinkContext1, 'out1']
  ])
  using outputs = initOutputs(bufferContext)

  t.execution(() => {
    graph.parse('split=2[out0][out1]', inputs, outputs)
  })

  t.execution(() => {
    graph.configure()
  })
})

test('FilterGraph.parse should handle multiple outputs', (t) => {
  const bufferContext0 = new ffmpeg.FilterContext()
  const bufferContext1 = new ffmpeg.FilterContext()
  const sinkContext = new ffmpeg.FilterContext()
  using graph = new ffmpeg.FilterGraph()
  const buffer0 = new ffmpeg.Filter('buffer')
  const buffer1 = new ffmpeg.Filter('buffer')
  const sink = new ffmpeg.Filter('buffersink')
  const args = `video_size=1x1:pix_fmt=${ffmpeg.constants.pixelFormats.RGB24}:time_base=1/30:pixel_aspect=1/1`

  graph.createFilter(bufferContext0, buffer0, 'in0', args)
  graph.createFilter(bufferContext1, buffer1, 'in1', args)
  graph.createFilter(sinkContext, sink, 'out')

  using inputs = initInputs(sinkContext)
  using outputs = createFilterInOutChain([
    [bufferContext0, 'in0'],
    [bufferContext1, 'in1']
  ])

  t.execution(() => {
    graph.parse('[in0][in1]hstack=inputs=2[out]', inputs, outputs)
  })

  t.execution(() => {
    graph.configure()
  })
})

test('FilterGraph.parse should throw an error if inputs are not valid', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)

  using inputs = initInputs(bufferSinkContext)
  using outputs = initOutputs(bufferContext)

  t.exception(() => {
    graph.parse('foo', inputs, outputs)
  })
})

test('FilterGraph should expose a configure method', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)

  using inputs = initInputs(bufferSinkContext)
  using outputs = initOutputs(bufferContext)

  graph.parse('negate', inputs, outputs)

  t.execution(() => {
    graph.configure()
  })
})

test('FilterGraph.configure should throw when parameters are not valid', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)

  using inputs = initInputs(bufferSinkContext)
  using outputs = new ffmpeg.FilterInOut()

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
  using inputs = initInputs(bufferSinkContext)
  using outputs = initOutputs(bufferContext)

  graph.parse('negate', inputs, outputs)
  graph.configure()

  using inputFrame = createFrame()
  t.ok(graph.pushFrame(bufferContext, inputFrame) >= 0)
})

test('FilterGraph should expose a pullFrame method', (t) => {
  const bufferContext = new ffmpeg.FilterContext()
  const bufferSinkContext = new ffmpeg.FilterContext()
  using graph = initGraph(bufferContext, bufferSinkContext)
  using inputs = initInputs(bufferSinkContext)
  using outputs = initOutputs(bufferContext)

  graph.parse('negate', inputs, outputs)
  graph.configure()

  using inputFrame = createFrame()
  graph.pushFrame(bufferContext, inputFrame)

  using outputFrame = createFrame()
  t.ok(graph.pullFrame(bufferSinkContext, outputFrame) >= 0)
})

// Helpers

function initGraph(bufferContext, bufferSinkContext) {
  const graph = new ffmpeg.FilterGraph()
  const buffer = new ffmpeg.Filter('buffer')
  const bufferSink = new ffmpeg.Filter('buffersink')

  graph.createFilter(
    bufferContext,
    buffer,
    'in',
    `video_size=1x1:pix_fmt=${ffmpeg.constants.pixelFormats.RGB24}:time_base=1/30:pixel_aspect=1/1`
  )
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

function createFilterInOutChain(entries) {
  const [[firstCtx, firstName], ...rest] = entries
  const head = new ffmpeg.FilterInOut()
  head.name = firstName
  head.filterContext = firstCtx
  head.padIdx = 0

  let current = head
  for (const [ctx, name] of rest) {
    const next = new ffmpeg.FilterInOut()
    next.name = name
    next.filterContext = ctx
    next.padIdx = 0
    current.next = next
    current = next
  }

  return head
}

function createFrame(width = 1, height = 1) {
  const frame = new ffmpeg.Frame()
  frame.width = width
  frame.height = height
  frame.format = ffmpeg.constants.pixelFormats.RGB24
  frame.alloc()
  return frame
}
