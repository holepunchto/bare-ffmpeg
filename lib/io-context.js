const binding = require('../binding')

module.exports = class FFmpegIOContext {
  constructor(buffer) {
    this._handle = binding.initIOContext(buffer)
  }

  destroy() {
    if (this._handle === null) return
    binding.destroyIOContext(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
