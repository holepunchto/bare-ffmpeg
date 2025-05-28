const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegFrame extends ReferenceCounted {
  constructor() {
    super()

    this._handle = binding.initFrame()
  }

  _destroy() {
    binding.destroyFrame(this._handle)
    this._handle = null
  }

  channel(i) {
    if (i < 0 || i > 7) {
      throw new RangeError(`Channel index must be between 0 and 7`)
    }

    return Buffer.from(binding.getFrameChannel(this._handle, i))
  }

  set width(value) {
    binding.setFrameWidth(this._handle, value)
  }

  get width() {
    return binding.getFrameWidth(this._handle)
  }

  set height(value) {
    binding.setFrameHeight(this._handle, value)
  }

  get height() {
    return binding.getFrameHeight(this._handle)
  }

  set pixelFormat(value) {
    binding.setFramePixelFormat(this._handle, value)
  }

  get pixelFormat() {
    return binding.getFramePixelFormat(this._handle)
  }

  getLineSize(channel) {
    return binding.getFrameLineSize(this._handle, channel)
  }

  alloc() {
    binding.allocFrame(this._handle, 32)
  }
}
