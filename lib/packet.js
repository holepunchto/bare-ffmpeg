const binding = require('../binding')

module.exports = class FFmpegPacket {
  constructor(buffer) {
    if (buffer) {
      this._handle = binding.initPacketFromBuffer(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength
      )
    } else {
      this._handle = binding.initPacket()
    }
  }

  destroy() {
    binding.unrefPacket(this._handle)
    this._handle = null
  }

  unref() {
    binding.unrefPacket(this._handle)
  }

  get streamIndex() {
    return binding.getPacketStreamIndex(this._handle)
  }

  get data() {
    return Buffer.from(binding.getPacketData(this._handle))
  }

  get isKeyframe() {
    return binding.isPacketKeyframe(this._handle)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
