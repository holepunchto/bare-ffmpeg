const binding = require('../binding')
const ChannelLayout = require('./channel-layout')
const Rational = require('./rational')

module.exports = class FFmpegFrame {
  constructor() {
    this._handle = binding.initFrame()
  }

  destroy() {
    binding.destroyFrame(this._handle)
    this._handle = null
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

  get pixelFormat() {
    return binding.getFramePixelFormat(this._handle)
  }

  set pixelFormat(value) {
    binding.setFramePixelFormat(this._handle, value)
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
    binding.setFrameChannelLayout(
      this._handle,
      ChannelLayout.from(value)._handle
    )
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
      pixelFormat: this.pixelFormat,
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
