const binding = require('../binding')

module.exports = class FFmpegFrame {
  constructor() {
    this._handle = binding.initFrame()
  }

  destroy() {
    if (this._handle === null) return
    binding.destroyFrame(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  channel(i) {
    if (i < 0 || i > 7) {
      throw new RangeError(`Channel index must be between 0 and 7`)
    }

    return Buffer.from(binding.getFrameChannel(this._handle, i))
  }
}
