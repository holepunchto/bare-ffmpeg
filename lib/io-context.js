const binding = require('../binding')

module.exports = class FFmpegIOContext {
  constructor(buffer = Buffer.alloc(0)) {
    this._handle = binding.initIOContext(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    )
  }

  destroy() {
    binding.destroyIOContext(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
