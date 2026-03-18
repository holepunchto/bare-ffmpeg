const binding = require('../binding')

module.exports = class SideData {
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
