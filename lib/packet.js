const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegPacket extends ReferenceCounted {
  constructor(buffer) {
    super()

    if (buffer) {
      if (!buffer.buffer || !(buffer.buffer instanceof ArrayBuffer)) {
        throw TypeError(
          `Buffer parameter should be of type Buffer but got: ${typeof buffer}`
        )
      }
      this._handle = binding.initPacketFromBuffer(buffer.buffer)
    } else {
      this._handle = binding.initPacket()
    }
  }

  _destroy() {
    binding.destroyPacket(this._handle)
    this._handle = null
  }

  unref() {
    this._unref()
    binding.unrefPacket(this._handle)
  }

  get streamIndex() {
    return binding.getPacketStreamIndex(this._handle)
  }

  get buffer() {
    return Buffer.from(binding.getPacketData(this._handle))
  }
}
