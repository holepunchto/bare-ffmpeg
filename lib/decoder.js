const binding = require('../binding')

module.exports = class FFmpegDecoder {
  constructor(codec) {
    this._codec = codec
    if (typeof codec._id == 'number') {
      this._handle = binding.findDecoderByID(codec._id)
    } else if (typeof codec._id == 'string') {
      this._handle = binding.findDecoderByName(codec._id)
    }
  }
}
