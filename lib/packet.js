const binding = require('../binding')

module.exports = class FFmpegPacket {
  constructor() {
    this._handle = binding.initPacket()
  }

  unref() {
    binding.unrefPacket(this._handle)
  }

  destroy() {
    if (this._handle === null) return
    binding.destroyPacket(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
