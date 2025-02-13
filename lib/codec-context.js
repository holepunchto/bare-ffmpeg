const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegCodecContext extends ReferenceCounted {
  constructor(codec, parameters) {
    super()

    this._codec = codec
    this._handle = binding.initCodecContext(codec._handle, parameters._handle)
  }

  _destroy() {
    binding.destroyCodecContext(this._handle)
    this._handle = null
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

  sendPacket(packet) {
    binding.sendCodecContextPacket(this._handle, packet._handle)
  }

  receiveFrame(frame) {
    return binding.receiveCodecContextFrame(this._handle, frame._handle)
  }
}
