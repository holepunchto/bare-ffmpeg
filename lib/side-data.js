module.exports = class SideData {
  constructor(handle, opts = {}) {
    this._handle = handle
    this._type = opts.type || null
    this._data = opts.data || null
  }

  static fromData(data, type) {
    return new this(null, { data, type })
  }

  _readType() {
    throw new Error('SideData._readType() must be implemented by a subclass')
  }

  _readName() {
    throw new Error('SideData._readName() must be implemented by a subclass')
  }

  _readBuffer() {
    throw new Error('SideData._readBuffer() must be implemented by a subclass')
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
