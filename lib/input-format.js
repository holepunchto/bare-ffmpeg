const binding = require('../binding')

module.exports = class FFmpegInputFormat {
  constructor(name) {
    this._handle = binding.initInputFormat(name)
  }
}
