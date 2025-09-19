const assert = require('bare-assert')
const ffmpeg = require('..')

const buffer = new ffmpeg.Filter('buffer')
const bufferContext = new ffmpeg.FilterContext()
const bufferSink = new ffmpeg.Filter('buffersink')
const bufferSinkContext = new ffmpeg.FilterContext()

const graph = new ffmpeg.FilterGraph()
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
outputs.name = 'in'
outputs.filterContext = bufferContext
outputs.padIdx = 0

graph.parse('negate', inputs, outputs)
graph.configure()

const inputFrame = new ffmpeg.Frame()
inputFrame.width = 1
inputFrame.height = 1
inputFrame.format = ffmpeg.constants.pixelFormats.RGB24
inputFrame.alloc()
const redImage = new ffmpeg.Image(ffmpeg.constants.pixelFormats.RGB24, 1, 1)

// Fill with red pixels (255, 0, 0)
for (let i = 0; i < redImage.data.length; i += 3) {
  redImage.data[i] = 255 // Red
  redImage.data[i + 1] = 0 // Green
  redImage.data[i + 2] = 0 // Blue
}

redImage.fill(inputFrame)
graph.pushFrame(bufferContext, inputFrame)

const outputFrame = new ffmpeg.Frame()
outputFrame.width = 1
outputFrame.height = 1
outputFrame.format = ffmpeg.constants.pixelFormats.RGB24
outputFrame.alloc()
graph.pullFrame(bufferSinkContext, outputFrame)

const outputImage = new ffmpeg.Image(ffmpeg.constants.pixelFormats.RGB24, 1, 1)
outputImage.read(outputFrame)

assert.equal(outputImage.data.at(0), 0)
assert.equal(outputImage.data.at(1), 255)
assert.equal(outputImage.data.at(2), 255)
