const binding = require('../binding')

module.exports = class FFmpegIOContext {
  constructor(buffer = Buffer.alloc(0), onwrite = undefined) {
    this._handle = binding.initIOContext(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
      onwrite
    )
  }

  destroy() {
    binding.destroyIOContext(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  static initFileOutput(path) {
    // TODO: provide binding.openIOContextURL(url, flags) instead
    const onwrite = buffer => {
      console.log('on write', buffer.byteLength)
    }
    return new FFmpegIOContext(Buffer.alloc(4096), onwrite)
  }
}
