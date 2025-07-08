const binding = require('../binding')

module.exports = class FFmpegIOContext {
  /**
   * @helpwanted
   *
   * @param {Buffer|number} buffer - ReadableIO: media data, WritableIO: ffmpeg-buffering size
   * @param {(chunk: Buffer) => void} onwrite - Write callback
   */
  constructor(buffer = undefined, onwrite = undefined) {
    let offset = 0
    let len = 0

    if (typeof buffer === 'number') {
      len = buffer
      buffer = undefined
    } else {
      offset = buffer.byteOffset
      len = buffer.byteLength
    }
    this._handle = binding.initIOContext(
      buffer,
      offset,
      len,
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
}
