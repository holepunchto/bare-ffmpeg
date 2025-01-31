const binding = require('../binding')

module.exports = class FFmpegEncoder {
  constructor(codec) {
    this._codec = codec
    this._handle = binding.findEncoderByID(codec._id)
  }
}
