const binding = require('../binding')

module.exports = class FFmpegOutputFormat {
  constructor(name) {
    this._handle = binding.initOutputFormat(name)
  }

  get name() {
    return binding.getOutputFormatName(this._handle)
  }

  get longName() {
    return binding.getOutputFormatLongName(this._handle)
  }

  get flags() {
    return binding.getOutputFormatFlags(this._handle)
  }
}
