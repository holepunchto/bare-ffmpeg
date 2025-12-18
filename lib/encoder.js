const binding = require('../binding')

module.exports = class FFmpegEncoder {
  constructor(codec) {
    if (typeof codec === 'string') {
      this._codec = { name: codec }
      this._handle = binding.findEncoderByName(codec)
    } else {
      this._codec = codec
      this._handle = binding.findEncoderByID(codec._id)
    }
  }
}
