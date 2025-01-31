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
}
