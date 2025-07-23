const binding = require('../binding')
const constants = require('./constants')

module.exports = class FFmpegChannelLayout {
  constructor(handle) {
    this._handle = handle
  }

  get nbChannels() {
    return binding.getChannelLayoutNbChannels(this._handle)
  }

  get mask() {
    return binding.getChannelLayoutMask(this._handle)
  }

  static from(value) {
    if (typeof value === 'string') value = constants.toChannelLayout(value)

    if (typeof value === 'number') {
      value = binding.channelLayoutFromMask(value)
    } else if (typeof value === 'object' && value !== null) {
      value = binding.copyChannelLayout(value._handle)
    }

    return new this(value)
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegChannelLayout },
      nbChannels: this.nbChannels
    }
  }
}
