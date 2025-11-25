const binding = require('../binding')
const ChannelLayout = require('./channel-layout')
const Rational = require('./rational')

class FrameMetadata {
  constructor(frame) {
    this._frame = frame
  }

  get(key) {
    const handle = this._frame?._handle
    if (!handle) return null

    const value = binding.getFrameMetadataEntry(handle, key)
    if (value === undefined) return null
    return value
  }

  entries() {
    const handle = this._frame?._handle
    if (!handle) return []
    return binding.getFrameMetadataEntries(handle)
  }

  *[Symbol.iterator]() {
    yield* this.entries()
  }
}

class FrameSideData {
  constructor(handle, opts = {}) {
    this._handle = handle
    this._type = opts.type || null
    this._data = opts.data || null
  }

  static fromData(data, type) {
    return new FrameSideData(null, { data, type })
  }

  get type() {
    if (this._type) return this._type
    return binding.getFrameSideDataType(this._handle)
  }

  get name() {
    if (!this._handle) return null
    return binding.getFrameSideDataName(this._handle)
  }

  get data() {
    if (this._data) return this._data
    return Buffer.from(binding.getFrameSideDataBuffer(this._handle))
  }
}

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

  copyProperties(source) {
    binding.copyFrameProperties(this._handle, source._handle)
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
