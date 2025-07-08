const binding = require('../binding')
/** @typedef {import('./stream')} Stream */
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

  /** @param {Stream} stream - Stream owning the packet */
  dump(stream, showPayload = false) {
    binding.dumpPacket(this._handle, showPayload, stream._handle)
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
