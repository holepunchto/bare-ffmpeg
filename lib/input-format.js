const binding = require('../binding')

module.exports = class FFmpegInputFormat {
  constructor(name) {
    if (typeof name !== 'string' || name.length < 1) {
      throw new TypeError('Input format name should be a non empty string')
    }
    this._handle = binding.initInputFormat(name)
  }
}
