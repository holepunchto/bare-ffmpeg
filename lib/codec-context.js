const binding = require('../binding')
const Rational = require('./rational')

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
    binding.sendCodecContextPacket(this._handle, packet._handle)
    return this
  }

  receivePacket(packet) {
    const res = binding.receiveCodecContextPacket(this._handle, packet._handle)
    if (res) packet._ref()
    return res
  }

  sendFrame(frame) {
    return binding.sendCodecContextFrame(this._handle, frame._handle)
  }

  receiveFrame(frame) {
    return binding.receiveCodecContextFrame(this._handle, frame._handle)
  }
}
