const binding = require('../binding')
const Rational = require('./rational')
const { packetSideDataType } = require('./constants')

class SideData {
  constructor(handle, opts = {}) {
    this._handle = handle
    this._type = opts.type || null
    this._data = opts.data || null
  }

  static fromData(data, type) {
    return new SideData(null, { data, type })
  }

  get type() {
    if (this._type) return this._type
    return binding.getSideDataType(this._handle)
  }

  get name() {
    if (!this._handle) return null
    return binding.getSideDataName(this._handle)
  }

  get data() {
    if (this._data) return this._data
    return Buffer.from(binding.getSideDataBuffer(this._handle))
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: SideData },
      type: this.type,
      name: this.name,
      data: this.data
    }
  }
}

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
    binding.destroyPacket(this._handle)
    this._handle = null
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

  set data(value) {
    binding.setPacketData(
      this._handle,
      value.buffer,
      value.byteOffset,
      value.byteLength
    )
  }

  get sideData() {
    const handles = binding.getPacketSideData(this._handle)
    return handles.map((handle) => new SideData(handle))
  }

  set sideData(values) {
    binding.setPacketSideData(
      this._handle,
      values.map((value) => ({
        buffer: value.data.buffer,
        offset: value.data.byteOffset,
        length: value.data.byteLength,
        type: value.type
      }))
    )
  }

  get isKeyframe() {
    return binding.isPacketKeyframe(this._handle)
  }

  set isKeyframe(value) {
    binding.setPacketIsKeyFrame(this._handle, value)
  }

  get dts() {
    return binding.getPacketDTS(this._handle)
  }

  set dts(value) {
    return binding.setPacketDTS(this._handle, value)
  }

  get pts() {
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

  rescaleTimestamps(rational) {
    return binding.rescalePacketTimestamps(
      this._handle,
      rational.numerator,
      rational.denominator
    )
  }

  copyPropsFrom(sourcePacket) {
    binding.copyPacketProps(this._handle, sourcePacket._handle)
  }

  getSideDataByType(type) {
    const data = binding.getPacketSideDataByType(this._handle, type)
    if (!data || data.byteLength === 0) return null
    return Buffer.from(data)
  }

  addSideData(type, data) {
    binding.addPacketSideData(
      this._handle,
      type,
      data.buffer,
      data.byteOffset,
      data.byteLength
    )
  }

  get duration() {
    return binding.getPacketDuration(this._handle)
  }

  set duration(value) {
    return binding.setPacketDuration(this._handle, value)
  }

  get flags() {
    return binding.getPacketFlags(this._handle)
  }

  set flags(value) {
    return binding.setPacketFlags(this._handle, value)
  }

  [Symbol.for('bare.inspect')]() {
    const sideData = this.sideData.map((sd) => ({
      type: sd.type,
      name: sd.name,
      size: sd.data.length
    }))

    const result = {
      __proto__: { constructor: FFmpegPacket },
      streamIndex: this.streamIndex,
      flags: this.flags,
      isKeyframe: this.isKeyframe,
      timeBase: this.timeBase,
      dts: this.dts,
      pts: this.pts,
      duration: this.duration,
      dataSize: this.data.length,
      sideData
    }

    const hasNewExtradata = !!this.getSideDataByType(
      packetSideDataType.NEW_EXTRADATA
    )
    const hasParamChange = !!this.getSideDataByType(
      packetSideDataType.PARAM_CHANGE
    )

    if (hasNewExtradata) result.hasNewExtradata = true
    if (hasParamChange) result.hasParamChange = true

    return result
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}

module.exports.SideData = SideData
