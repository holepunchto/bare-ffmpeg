const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')
const Rational = require('./rational')

module.exports = class FFmpegCodecContext extends ReferenceCounted {
  constructor(codec) {
    super()

    this._codec = codec
    this._opened = false
    this._handle = binding.initCodecContext(codec._handle)
  }

  _destroy() {
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
    const view = new Int32Array(2)
    view[0] = value.numerator
    view[1] = value.denominator
    binding.setCodecContextTimeBase(this._handle, view.buffer)
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

  sendFrame(frame) {
    return binding.sendCodecContextFrame(this._handle, frame._handle)
  }

  receiveFrame(frame) {
    return binding.receiveCodecContextFrame(this._handle, frame._handle)
  }
}
