const binding = require('../binding')

module.exports = class FFmpegIOContext {
  constructor(buffer, opts = {}) {
    if (buffer === null && opts === null) {
      this._handle = null
      return
    }

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

    this._handle = binding.initIOContext(
      buffer,
      offset,
      len,
      opts.onwrite && onwriteWrapper.bind(null, opts.onwrite),
      opts.onread && onreadWrapper.bind(null, opts.onread),
      opts.onseek
    )
  }

  destroy() {
    if (this._handle) {
      binding.destroyIOContext(this._handle)
      this._handle = null
    }
  }

  transfer() {
    const to = new FFmpegIOContext(null, null)
    to._handle = this._handle
    this._handle = null
    return to
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}

function onwriteWrapper(target, arraybuffer) {
  return target(Buffer.from(arraybuffer))
}

function onreadWrapper(target, arraybuffer, requestedLen) {
  return target(Buffer.from(arraybuffer), requestedLen)
}
