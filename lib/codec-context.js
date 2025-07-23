const binding = require('../binding')
const Rational = require('./rational')
const ChannelLayout = require('./channel-layout')

module.exports = class FFmpegCodecContext {
  constructor(codec) {
    this._codec = codec
    this._opened = false
    this._handle = binding.initCodecContext(codec._handle)
  }

  destroy() {
    binding.destroyCodecContext(this._handle)
    this._handle = null
  }

  get pixelFormat() {
    return binding.getCodecContextPixelFormat(this._handle)
  }

  set pixelFormat(value) {
    binding.setCodecContextPixelFormat(this._handle, value)
  }

  get width() {
    return binding.getCodecContextWidth(this._handle)
  }

  set width(value) {
    binding.setCodecContextWidth(this._handle, value)
  }

  get height() {
    return binding.getCodecContextHeight(this._handle)
  }

  set height(value) {
    binding.setCodecContextHeight(this._handle, value)
  }

  get sampleFormat() {
    return binding.getCodecContextSampleFormat(this._handle)
  }

  set sampleFormat(value) {
    return binding.setCodecContextSampleFormat(this._handle, value)
  }

  get sampleRate() {
    return binding.getCodecContextSampleRate(this._handle)
  }

  set sampleRate(value) {
    binding.setCodecContextSampleRate(this._handle, value)
  }

  get timeBase() {
    const view = new Int32Array(binding.getCodecContextTimeBase(this._handle))
    return new Rational(view[0], view[1])
  }

  set timeBase(value) {
    binding.setCodecContextTimeBase(
      this._handle,
      value.numerator,
      value.denominator
    )
  }

  get frameRate() {
    const view = new Int32Array(binding.getCodecContextFramerate(this._handle))
    return new Rational(view[0], view[1])
  }

  set frameRate(value) {
    binding.setCodecContextFramerate(
      this._handle,
      value.numerator,
      value.denominator
    )
  }

  get channelLayout() {
    return new ChannelLayout(binding.getCodecContextChannelLayout(this._handle))
  }

  set channelLayout(value) {
    binding.setCodecContextChannelLayout(
      this._handle,
      ChannelLayout.from(value)._handle
    )
  }

  get gopSize() {
    return binding.getCodecContextGOPSize(this._handle)
  }

  set gopSize(value) {
    binding.setCodecContextGOPSize(this._handle, value)
  }

  get flags() {
    return binding.getCodecContextFlags(this._handle)
  }

  set flags(value) {
    binding.setCodecContextFlags(this._handle, value)
  }

  open(options) {
    if (this._opened) return
    this._opened = true
    if (options) {
      binding.openCodecContextWithOptions(this._handle, options._handle)
    } else {
      binding.openCodecContext(this._handle)
    }
    return this
  }

  sendPacket(packet) {
    return binding.sendCodecContextPacket(this._handle, packet._handle)
  }

  receivePacket(packet) {
    return binding.receiveCodecContextPacket(this._handle, packet._handle)
  }

  sendFrame(frame) {
    let frameHandle = undefined

    if (frame) frameHandle = frame._handle

    return binding.sendCodecContextFrame(this._handle, frameHandle)
  }

  receiveFrame(frame) {
    return binding.receiveCodecContextFrame(this._handle, frame._handle)
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegCodecContext },
      _codec: this._codec,
      _opened: this._opened,
      flags: this.flags,
      pixelFormat: this.pixelFormat,
      width: this.width,
      height: this.height,
      sampleFormat: this.sampleFormat,
      sampleRate: this.sampleRate,
      timeBase: this.timeBase,
      channelLayout: this.channelLayout,
      gopSize: this.gopSize
    }
  }
}
