const binding = require('../binding')

module.exports = class FFmpegOutputFormat {
  constructor(name) {
    this._handle = binding.initOutputFormat(name)
  }
}
