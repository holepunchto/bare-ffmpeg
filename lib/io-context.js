const binding = require('../binding')

module.exports = class FFmpegIOContext {
  constructor(buffer, opts = {}) {
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
      buffer = Buffer.alloc(0)
    }

    let onwrite
    if (opts.onwrite) {
      onwrite = (chunk) => {
        opts.onwrite(Buffer.from(chunk))
      }
    }

    let onread
    if (opts.onread) {
      onread = (requested) => {
        const out = opts.onread(requested)
        return out.buffer.slice(
          out.byteOffset || 0,
          (out.byteOffset || 0) + out.byteLength
        )
      }
    }

    let onseek
    if (opts.onseek) {
      onseek = (newOffset) => {
        opts.onseek(Number(newOffset))
      }
    }

    this._handle = binding.initIOContext(
      buffer,
      offset,
      len,
      onwrite,
      onread,
      onseek
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
