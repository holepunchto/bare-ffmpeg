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

  unref() {
    binding.unrefPacket(this._handle)
  }

  get streamIndex() {
    return binding.getPacketStreamIndex(this._handle)
  }

  set streamIndex(value) {
    return binding.setPacketStreamIndex(this._handle, value)
  }

  get data() {
    return Buffer.from(binding.getPacketData(this._handle))
  }

  get keyframe() {
    return binding.isPacketKeyframe(this._handle)
  }

  get dts () {
    return binding.getPacketDTS(this._handle)
  }

  set dts(value) {
    return binding.setPacketDTS(this._handle, value)
  }

  get pts () {
    return binding.getPacketPTS(this._handle)
  }

  set pts(value) {
    return binding.setPacketPTS(this._handle, value)
  }

  get timeBase() {
    const view = new Int32Array(binding.getPacketTimeBase(this._handle))
    return new Rational(view[0], view[1])
  }

  set timeBase(value) {
    binding.setPacketTimeBase(this._handle, value.numerator, value.denominator)
  }

  rescaleTimestamps(timeBase) {
    return rescalePacketTimestamps(this._handle, value.numerator, value.denominator)
  }

  destroy() {
    binding.unrefPacket(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      streamIndex: this.streamIndex,
      isKeyframe: this.keyframe,
      timeBase: this.timeBase,
      dts: this.dts,
      pts: this.pts,
      data: this.data.byteLength
    }
  }
}
