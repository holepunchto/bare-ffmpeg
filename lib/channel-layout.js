const binding = require('../binding')

module.exports = class FFmpegChannelLayout {
  constructor(handle) {
    this._handle = handle
  }

  get nbChannels() {
    return binding.getChannelLayoutNbChannels(this._handle)
  }

  destroy() {
    binding.destroyChannelLayout(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
