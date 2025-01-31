const binding = require('../binding')

module.exports = class FFmpegCodecContext {
  constructor(codec, parameters) {
    this._codec = codec
    this._handle = binding.initCodecContext(codec._handle, parameters._handle)
  }

  get pixelFormat() {
    return binding.getCodecContextPixelFormat(this._handle)
  }

  get width() {
    return binding.getCodecContextWidth(this._handle)
  }

  get height() {
    return binding.getCodecContextHeight(this._handle)
  }

  destroy() {
    if (this._handle === null) return
    binding.destroyCodecContext(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  sendPacket(packet) {
    binding.sendCodecContextPacket(this._handle, packet._handle)
  }

  receiveFrame(frame) {
    binding.receiveCodecContextFrame(this._handle, frame._handle)
  }
}
