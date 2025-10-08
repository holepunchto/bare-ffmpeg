const assert = require('bare-assert')
const ffmpeg = require('..')

const sampleRate = 48000
const sampleFormat = ffmpeg.constants.sampleFormats.S16
const channelLayout = ffmpeg.constants.channelLayouts.MONO
const nbSamples = 1024

const graph = new ffmpeg.FilterGraph()
const abuffer = new ffmpeg.Filter('abuffer')
const abuffersink = new ffmpeg.Filter('abuffersink')
const srcCtx = new ffmpeg.FilterContext()
const sinkCtx = new ffmpeg.FilterContext()

graph.createFilter(
  srcCtx,
  abuffer,
  'in',
  'sample_rate=48000:sample_fmt=s16:channel_layout=mono:time_base=1/48000'
)
graph.createFilter(sinkCtx, abuffersink, 'out')

const inputs = new ffmpeg.FilterInOut()
inputs.name = 'out'
inputs.filterContext = sinkCtx
inputs.padIdx = 0

const outputs = new ffmpeg.FilterInOut()
outputs.name = 'in'
outputs.filterContext = srcCtx
outputs.padIdx = 0

graph.parse(
  'volume=0.5,aformat=sample_fmts=s16:channel_layouts=mono',
  inputs,
  outputs
)

graph.configure()

const inputFrame = new ffmpeg.Frame()
inputFrame.format = sampleFormat
inputFrame.channelLayout = channelLayout
inputFrame.nbSamples = nbSamples
inputFrame.sampleRate = sampleRate
inputFrame.timeBase = new ffmpeg.Rational(1, sampleRate)
inputFrame.pts = 0
inputFrame.alloc()

const inputSamples = new ffmpeg.Samples()
inputSamples.fill(inputFrame)

const sampleView = new Int16Array(
  inputSamples.data.buffer,
  inputSamples.data.byteOffset,
  nbSamples
)
for (let i = 0; i < nbSamples; i++) {
  const value = Math.sin((2 * Math.PI * 1000 * i) / sampleRate) * 0.5
  sampleView[i] = Math.round(value * 32767)
}
const inputSample = sampleView[100]

assert(graph.pushFrame(srcCtx, inputFrame) >= 0, 'Failed to push frame')

const outputFrame = new ffmpeg.Frame()
outputFrame.format = sampleFormat
outputFrame.channelLayout = channelLayout
outputFrame.nbSamples = nbSamples
outputFrame.sampleRate = sampleRate
outputFrame.timeBase = new ffmpeg.Rational(1, sampleRate)

assert(graph.pullFrame(sinkCtx, outputFrame) >= 0, 'Failed to pull frame')

const outputSamples = new ffmpeg.Samples()
outputSamples.read(outputFrame)

const outputSample = outputSamples.data.readInt16LE(100 * 2)
const ratio = outputSample / inputSample

assert(Math.abs(ratio - 0.5) < 0.1, 'Volume was not reduced by ~50%')

inputFrame.destroy()
outputFrame.destroy()
graph.destroy()
