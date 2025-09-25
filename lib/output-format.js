const binding = require('../binding')

module.exports = class FFmpegOutputFormat {
  constructor(name) {
    this._handle = binding.initOutputFormat(name)
  }

  get flags() {
    return binding.getOutputFormatFlags(this._handle)
  }

  get extensions() {
    return binding.getOutputFormatExtensions(this._handle)
  }

  get mimeType() {
    return binding.getOutputFormatMimeType(this._handle)
  }
}
