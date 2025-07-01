const binding = require('../binding')
const Rational = require('./rational')

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

  set streamIndex(value) {
    binding.setPacketStreamIndex(this._handle, value)
  }

  get dts() {
    return binding.getPacketDTS(this._handle)
  }

  set dts(value) {
    binding.setPacketDTS(this._handle, value)
  }

  get pts() {
    return binding.getPacketPTS(this._handle)
  }

  set pts(value) {
    binding.setPacketPTS(this._handle, value)
  }

  get timeBase() {
    const view = new Int32Array(binding.getStreamTimeBase(this._handle))
    return new Rational(view[0], view[1])
  }

  set timeBase(value) {
    binding.setPacketTimeBase(this._handle, value.numerator, value.denominator)
  }

  get data() {
    return Buffer.from(binding.getPacketData(this._handle))
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
