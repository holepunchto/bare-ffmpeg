const test = require('brittle')
const ffmpeg = require('..')

test('it should expose a FilterContext class', (t) => {
  const filterCtx = new ffmpeg.FilterContext()
  t.ok(filterCtx)
})

test('FilterContext.getOption returns the current option value', (t) => {
  const volumeCtx = setupVolumePipeline(t)

  const volume = volumeCtx.getOption('volume')
  t.is(typeof volume, 'string')
  t.ok(Number.isFinite(Number(volume)))
})

test('FilterContext.setOption updates the option value', (t) => {
  const volumeCtx = setupVolumePipeline(t)

  volumeCtx.setOption('volume', '0.5')
  t.is(Number(volumeCtx.getOption('volume')), 0.5)
})

test('FilterContext.setOptionDefaults restores default values', (t) => {
  const volumeCtx = setupVolumePipeline(t)

  const original = Number(volumeCtx.getOption('volume'))

  volumeCtx.setOption('volume', '0.5')
  t.is(Number(volumeCtx.getOption('volume')), 0.5)

  // Also resets options in the wrapped filter's private data (child object),
  // not just those on the AVFilterContext itself.
  volumeCtx.setOptionDefaults()
  t.is(Number(volumeCtx.getOption('volume')), original)
})

test('FilterContext can set options via dictionary', (t) => {
  const volumeCtx = setupVolumePipeline(t)

  const expected = '0.25'

  using options = ffmpeg.Dictionary.from({ volume: expected })

  volumeCtx.setOptionDictionary(options)

  t.is(volumeCtx.getOption('volume'), expected)
})

test('FilterContext.listOptionNames returns available names', (t) => {
  const volumeCtx = setupVolumePipeline(t)

  const names = volumeCtx.listOptionNames()

  t.ok(Array.isArray(names))
  t.ok(names.includes('volume'))
})

test('FilterContext.getOptions collects string values', (t) => {
  const volumeCtx = setupVolumePipeline(t)

  volumeCtx.setOption('volume', '0.75')

  const options = volumeCtx.getOptions()
  t.is(options.volume, '0.75')
})

test('FilterContext.setOption throws on unknown option', (t) => {
  const volumeCtx = setupVolumePipeline(t)

  t.exception(() => {
    volumeCtx.setOption('not-an-option', 'value')
  }, /option/i)
})

function setupVolumePipeline(t) {
  const graph = new ffmpeg.FilterGraph()
  const source = new ffmpeg.Filter('abuffer')
  const volume = new ffmpeg.Filter('volume')
  const sink = new ffmpeg.Filter('abuffersink')

  const sourceCtx = new ffmpeg.FilterContext()
  const volumeCtx = new ffmpeg.FilterContext()
  const sinkCtx = new ffmpeg.FilterContext()

  graph.createFilter(
    sourceCtx,
    source,
    'src',
    'sample_rate=48000:sample_fmt=s16:channel_layout=mono:time_base=1/48000'
  )
  graph.createFilter(volumeCtx, volume, 'vol')
  graph.createFilter(sinkCtx, sink, 'sink')

  t.teardown(() => {
    graph.destroy()
  })

  return volumeCtx
}
