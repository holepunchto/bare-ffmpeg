const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegPacket extends ReferenceCounted {
  constructor() {
    super()

    this._handle = binding.initPacket()
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
    return binding.getPacketDataAsArrayBuffer(this._handle)
  }
}
