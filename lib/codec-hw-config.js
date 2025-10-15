const binding = require('../binding')

module.exports = class FFmpegCodecHWConfig {
  constructor(handle) {
    this._handle = handle
  }

  get methods() {
    return binding.getCodecHardwareConfigMethods(this._handle)
  }
}
