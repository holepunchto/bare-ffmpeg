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
    return binding.getFrameChannelLayout(this._handle)
  }

  set channelLayout(value) {
    binding.setFrameChannelLayout(this._handle, value)
  }

  get nbSamples() {
    return binding.getFrameNbSamples(this._handle)
  }

  set nbSamples(value) {
    binding.setFrameNbSamples(this._handle, value)
  }

  audioChannel(i) {
    if (i < 0 || i > 7) {
      throw new RangeError(`Channel index must be between 0 and 7`)
    }

    return Buffer.from(binding.getFrameAudioChannel(this._handle, i))
  }

  alloc() {
    binding.allocFrame(this._handle, 32)
  }
}
