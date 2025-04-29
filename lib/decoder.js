const binding = require('../binding')

module.exports = class FFmpegDecoder {
  constructor(codec) {
    this._codec = codec
    this._handle = binding.findDecoderByID(codec._id)
  }
}
