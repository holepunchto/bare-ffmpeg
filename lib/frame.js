const binding = require('../binding')
const ChannelLayout = require('./channel-layout')

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

  alloc() {
    binding.allocFrame(this._handle, 32)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
