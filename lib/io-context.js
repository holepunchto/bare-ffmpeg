const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegIOContext extends ReferenceCounted {
  constructor(buffer) {
    super()

    this._handle = binding.initIOContext(buffer)
  }

  _destroy() {
    binding.destroyIOContext(this._handle)
    this._handle = null
  }
}
