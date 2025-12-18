const binding = require('../binding')

module.exports = class FFmpegDecoder {
  constructor(codec) {
    if (typeof codec === 'string') {
      this._handle = binding.findDecoderByName(codec)
    } else {
      this._handle = binding.findDecoderByID(codec._id)
    }
  }
}
