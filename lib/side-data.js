const binding = require('../binding')

module.exports = class SideData {
  constructor(handle, opts = {}) {
    this._handle = handle
    this._type = opts.type || null
    this._data = opts.data || null
  }

  static fromData(data, type) {
    return new this(null, { data, type })
  }

  // Overridable accessors so container-specific side data (e.g. frames) can
  // reuse this class by pointing them at their own bindings.
  _readType() {
    return binding.getSideDataType(this._handle)
  }

  _readName() {
    return binding.getSideDataName(this._handle)
  }

  _readBuffer() {
    return binding.getSideDataBuffer(this._handle)
  }

  get type() {
    if (this._type) return this._type
    return this._readType()
  }

  get name() {
    if (!this._handle) return null
    return this._readName()
  }

  get data() {
    if (this._data) return this._data
    return Buffer.from(this._readBuffer())
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: this.constructor },
      type: this.type,
      name: this.name,
      data: this.data
    }
  }
}
