module.exports = class SideData {
  constructor(handle, opts = {}) {
    this._handle = handle
    this._type = opts.type || null
    this._data = opts.data || null
  }

  static from(readType, readName, readBuffer) {
    return class extends this {
      _readType() {
        return readType(this._handle)
      }

      _readName() {
        return readName(this._handle)
      }

      _readBuffer() {
        return readBuffer(this._handle)
      }
    }
  }

  static fromData(data, type) {
    return new this(null, { data, type })
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
      __proto__: { constructor: SideData },
      type: this.type,
      name: this.name,
      data: this.data
    }
  }
}
