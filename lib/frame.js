const binding = require('../binding')
const ChannelLayout = require('./channel-layout')
const HWFramesContext = require('./hw-frames-context')
const Rational = require('./rational')
const SideData = require('./side-data')
const constants = require('./constants')

class FrameMetadata {
  constructor(frame) {
    this._frameHandle = frame._handle
  }

  get(key) {
    if (!this._frameHandle) return null

    const value = binding.getFrameMetadataEntry(this._frameHandle, key)
    if (value === undefined) return null
    return value
  }

  entries() {
    if (!this._frameHandle) return []
    return binding.getFrameMetadataEntries(this._frameHandle)
  }

  *[Symbol.iterator]() {
    yield* this.entries()
  }
}

const FrameSideData = SideData.from(
  binding.getFrameSideDataType,
  binding.getFrameSideDataName,
  binding.getFrameSideDataBuffer
)

module.exports = class FFmpegFrame {
  constructor() {
    this._handle = binding.initFrame()
    this._metadata = null
  }

  destroy() {
    binding.destroyFrame(this._handle)
    this._handle = null
    this._metadata = null
  }

  unref() {
    binding.unrefFrame(this._handle)
  }

  get width() {
    return binding.getFrameWidth(this._handle)
  }

  set width(value) {
    binding.setFrameWidth(this._handle, value)
  }

  get height() {
    return binding.getFrameHeight(this._handle)
  }

  set height(value) {
    binding.setFrameHeight(this._handle, value)
  }

  get format() {
    return binding.getFrameFormat(this._handle)
  }

  set format(value) {
    binding.setFrameFormat(this._handle, value)
  }

  get channelLayout() {
    return new ChannelLayout(binding.getFrameChannelLayout(this._handle))
  }

  set channelLayout(value) {
    binding.setFrameChannelLayout(this._handle, ChannelLayout.from(value)._handle)
  }

  get nbSamples() {
    return binding.getFrameNbSamples(this._handle)
  }

  set nbSamples(value) {
    binding.setFrameNbSamples(this._handle, value)
  }

  get pictType() {
    return binding.getFramePictType(this._handle)
  }

  get pts() {
    return binding.getFramePTS(this._handle)
  }

  set pts(value) {
    return binding.setFramePTS(this._handle, value)
  }

  get packetDTS() {
    return binding.getFramePacketDTS(this._handle)
  }

  set packetDTS(value) {
    return binding.setFramePacketDTS(this._handle, value)
  }

  get timeBase() {
    const view = new Int32Array(binding.getFrameTimeBase(this._handle))
    return new Rational(view[0], view[1])
  }

  set timeBase(value) {
    binding.setFrameTimeBase(this._handle, value.numerator, value.denominator)
  }

  get sampleRate() {
    return binding.getFrameSampleRate(this._handle)
  }

  set sampleRate(value) {
    binding.setFrameSampleRate(this._handle, value)
  }

  get metadata() {
    if (!this._metadata) this._metadata = new FrameMetadata(this)
    return this._metadata
  }

  get sideData() {
    const handles = binding.getFrameSideData(this._handle)
    return handles.map((handle) => new FrameSideData(handle))
  }

  set sideData(values) {
    binding.setFrameSideData(
      this._handle,
      values.map((value) => ({
        buffer: value.data.buffer,
        offset: value.data.byteOffset,
        length: value.data.byteLength,
        type: value.type
      }))
    )
  }

  removeSideData(type) {
    binding.removeFrameSideData(this._handle, type)
  }

  get hwFramesCtx() {
    const handle = binding.getFrameHWFramesCtx(this._handle)
    return handle ? HWFramesContext.from(handle) : null
  }

  set hwFramesCtx(hwFramesContext) {
    binding.setFrameHWFramesCtx(this._handle, hwFramesContext._handle)
  }

  copyProperties(source) {
    binding.copyFrameProperties(this._handle, source._handle)
  }

  transferData(destination) {
    binding.transferFrameData(destination._handle, this._handle)
  }

  hwMap(destination, flags = constants.hwFrameMapFlags.NONE) {
    binding.mapFrame(destination._handle, this._handle, flags)
  }

  alloc() {
    binding.allocFrame(this._handle, 32)
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegFrame },
      width: this.width,
      height: this.height,
      format: this.format,
      channelLayout: this.channelLayout,
      nbSamples: this.nbSamples,
      pictType: this.pictType,
      pts: this.pts,
      packetDTS: this.packetDTS,
      timeBase: this.timeBase
    }
  }
}

module.exports.SideData = FrameSideData
