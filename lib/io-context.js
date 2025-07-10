const binding = require('../binding')

module.exports = class FFmpegIOContext {
  /**
   * TODO: (help) redesign class to enable streaming IO or filehandles
   *
   * @param {(Buffer|number|undefined)} buffer - data | write buffer size
   * @param {(chunk: Buffer) => void} onwrite - Write callback
   */
  constructor(buffer, onwrite = undefined) {
    let offset = 0
    let len = 0

    if (typeof buffer === 'number') {
      len = buffer
      buffer = undefined
    } else if (buffer) {
      offset = buffer.byteOffset
      len = buffer.byteLength
      buffer = buffer.buffer
    } else {
      buffer = Buffer.alloc(0) // original behavior
    }

    if (typeof onwrite === 'function') {
      const userCallback = onwrite
      onwrite = function (chunk) {
        userCallback(Buffer.from(chunk))
      }
    }

    this._handle = binding.initIOContext(buffer, offset, len, onwrite)
  }

  destroy() {
    binding.destroyIOContext(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
