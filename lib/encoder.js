const binding = require('../binding')

module.exports = class FFmpegEncoder {
  constructor(codec) {
    this._codec = codec
    if (typeof codec == 'number') {
      this._handle = binding.findEncoderByID(codec._id)
    } else if (typeof codec == 'string') {
      this._handle = binding.findEncoderByName(codec._id)
    }
  }
}
