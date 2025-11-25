const test = require('brittle')
const ffmpeg = require('..')

test('frame expose a setter for width', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.width = 200
  })
})

test('frame expose a getter for width', (t) => {
  const fr = new ffmpeg.Frame()
  fr.width = 200

  t.ok(fr.width === 200)
})

test('frame expose a setter for height', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.height = 200
  })
})

test('frame expose a getter for height', (t) => {
  const fr = new ffmpeg.Frame()
  fr.height = 200

  t.ok(fr.height === 200)
})

test('frame expose a setter for format', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.format = ffmpeg.constants.pixelFormats.YUV420P
  })
})

test('frame expose a getter for format', (t) => {
  const fr = new ffmpeg.Frame()
  fr.format = ffmpeg.constants.pixelFormats.YUV420P

  t.ok(fr.format === ffmpeg.constants.pixelFormats.YUV420P)
})

test('frame expose an alloc method', (t) => {
  const fr = new ffmpeg.Frame()

  fr.height = 200
  fr.width = 200
  fr.format = ffmpeg.constants.pixelFormats.YUV420P
  t.execution(() => {
    fr.alloc()
  })
})

test('frame expose a setter for nbSamples', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.nbSamples = 1024
  })
})

test('frame expose a accessor for pts', (t) => {
  const fr = new ffmpeg.Frame()

  t.is(fr.pts, -1)

  fr.pts = 0

  t.is(fr.pts, 0)
})

test('frame expose a accessor for pkt_dts', (t) => {
  const fr = new ffmpeg.Frame()

  t.is(fr.packetDTS, -1)

  fr.packetDTS = 0

  t.is(fr.packetDTS, 0)
})

test('frame expose a accessor for timeBase', (t) => {
  const fr = new ffmpeg.Frame()

  t.alike(fr.timeBase, new ffmpeg.Rational(0, 1))

  const base = new ffmpeg.Rational(1, 1000)
  fr.timeBase = base

  t.alike(fr.timeBase, base)
})

test('frame expose getter for picture type', (t) => {
  const fr = new ffmpeg.Frame()
  t.is(fr.pictType, ffmpeg.constants.pictureTypes.NONE)
})

test('frame expose a setter for sampleRate', (t) => {
  const fr = new ffmpeg.Frame()
  t.execution(() => {
    fr.sampleRate = 48000
  })
})

test('frame expose a getter for sampleRate', (t) => {
  const fr = new ffmpeg.Frame()
  fr.sampleRate = 48000

  t.ok(fr.sampleRate === 48000)
})

test('copy frame properties', (t) => {
  const a = new ffmpeg.Frame()
  a.pts = 12
  a.sideData = [
    ffmpeg.Frame.SideData.fromData(
      Buffer.from(Array.from({ length: 32 }, (_, index) => index & 0xff)),
      ffmpeg.constants.frameSideDataType.CONTENT_LIGHT_LEVEL
    )
  ]

  const b = new ffmpeg.Frame()
  t.not(b.pts, 12)

  b.copyProperties(a)

  t.is(b.pts, 12)
  t.is(b.sideData.length, 1)
  t.is(
    b.sideData[0].type,
    ffmpeg.constants.frameSideDataType.CONTENT_LIGHT_LEVEL
  )
  t.ok(b.sideData[0].data.equals(a.sideData[0].data))
})

test('Frame sideData round-trips custom payloads', (t) => {
  const frame = new ffmpeg.Frame()

  const payload = Buffer.from(
    Array.from({ length: 32 }, (_, index) => (index * 7) & 0xff)
  )

  frame.sideData = [
    ffmpeg.Frame.SideData.fromData(
      payload,
      ffmpeg.constants.frameSideDataType.CONTENT_LIGHT_LEVEL
    )
  ]

  const sideData = frame.sideData
  t.is(sideData.length, 1)
  t.is(sideData[0].type, ffmpeg.constants.frameSideDataType.CONTENT_LIGHT_LEVEL)
  t.ok(sideData[0].data.equals(payload))

  frame.removeSideData(ffmpeg.constants.frameSideDataType.CONTENT_LIGHT_LEVEL)
  t.is(frame.sideData.length, 0)

  frame.destroy()
})

test('Frame.metadata exposes filter-produced entries', (t) => {
  const { graph, sourceCtx, sinkCtx } = setupAstatsGraph(t)

  const inputFrame = createAudioFrame(0)
  t.teardown(() => {
    inputFrame.destroy()
  })

  t.ok(graph.pushFrame(sourceCtx, inputFrame) >= 0)

  const outputFrame = new ffmpeg.Frame()
  t.teardown(() => {
    outputFrame.destroy()
  })

  t.ok(graph.pullFrame(sinkCtx, outputFrame) >= 0)

  const entries = outputFrame.metadata.entries()
  t.ok(entries.length > 0)

  const astatsEntry = entries.find(([key]) => key.startsWith('lavfi.astats.'))
  t.ok(astatsEntry)

  const [key, value] = astatsEntry
  t.is(outputFrame.metadata.get(key), value)
  t.is(outputFrame.metadata.get('missing-key'), null)
})

function setupAstatsGraph(t) {
  const graph = new ffmpeg.FilterGraph()
  const abuffer = new ffmpeg.Filter('abuffer')
  const abuffersink = new ffmpeg.Filter('abuffersink')

  const sourceCtx = new ffmpeg.FilterContext()
  const sinkCtx = new ffmpeg.FilterContext()

  graph.createFilter(
    sourceCtx,
    abuffer,
    'src',
    'sample_rate=48000:sample_fmt=s16:channel_layout=mono:time_base=1/48000'
  )
  graph.createFilter(sinkCtx, abuffersink, 'sink')

  const inputs = new ffmpeg.FilterInOut()
  inputs.name = 'out'
  inputs.filterContext = sinkCtx
  inputs.padIdx = 0

  const outputs = new ffmpeg.FilterInOut()
  outputs.name = 'in'
  outputs.filterContext = sourceCtx
  outputs.padIdx = 0

  graph.parse('astats=metadata=1:reset=1', inputs, outputs)
  graph.configure()

  t.teardown(() => {
    graph.destroy()
  })

  return { graph, sourceCtx, sinkCtx }
}

function createAudioFrame(pts = 0) {
  const sampleRate = 48000
  const sampleFormat = ffmpeg.constants.sampleFormats.S16
  const channelLayout = ffmpeg.constants.channelLayouts.MONO
  const nbSamples = 1024

  const frame = new ffmpeg.Frame()
  frame.format = sampleFormat
  frame.channelLayout = channelLayout
  frame.nbSamples = nbSamples
  frame.sampleRate = sampleRate
  frame.timeBase = new ffmpeg.Rational(1, sampleRate)
  frame.pts = pts
  frame.alloc()

  const samples = new ffmpeg.Samples()
  samples.fill(frame)

  const view = new Int16Array(
    samples.data.buffer,
    samples.data.byteOffset,
    nbSamples
  )

  for (let i = 0; i < nbSamples; i++) {
    const value = Math.sin((2 * Math.PI * 440 * i) / sampleRate)
    view[i] = Math.round(value * 32767)
  }

  return frame
}
