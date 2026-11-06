const binding = require('../binding')
const supportedConfig = require('./supported-config')

module.exports = class FFmpegEncoder {
  constructor(codec) {
    if (typeof codec === 'string') {
      this._handle = binding.findEncoderByName(codec)
    } else {
      this._handle = binding.findEncoderByID(codec._id)
    }
  }

  getSupportedConfig(config) {
    return supportedConfig(undefined, this._handle, config)
  }

  get hwConfigs() {
    return binding.getCodecHWConfigs(this._handle)
  }
}
