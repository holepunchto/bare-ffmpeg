const binding = require('../binding')

module.exports = class FFmpegOutputFormat {
  constructor(name) {
    this._handle = binding.initOutputFormat(name)
  }

  get flags() {
    return binding.getOutputFormatFlags(this._handle)
  }
}
