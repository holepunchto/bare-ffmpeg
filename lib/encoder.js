const binding = require('../binding')
const constants = require('./constants')

module.exports = class FFmpegEncoder {
  constructor(codec) {
    this._codec = codec
    if (typeof codec._id == 'number') {
      this._handle = binding.findEncoderByID(codec._id)
    } else if (typeof codec._id == 'string') {
      const name = constants.encoderMap[codec._id] || codec._id
      this._handle = binding.findEncoderByName(name)
    }
  }
}
