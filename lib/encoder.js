const binding = require('../binding')

module.exports = class FFmpegEncoder {
  constructor(codec) {
    if (typeof codec === 'string') {
      this._handle = binding.findEncoderByName(codec)
    } else {
      this._handle = binding.findEncoderByID(codec._id)
    }
  }
}
