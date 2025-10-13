const binding = require('../binding')

module.exports = class FFmpegCodecHWConfig {
  constructor(handle) {
    this._handle = handle
  }
}
