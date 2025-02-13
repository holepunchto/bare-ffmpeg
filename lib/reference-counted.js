module.exports = class FFmpegReferenceCounted {
  constructor() {
    this._refs = 0
    this._destroyed = false
  }

  _ref() {
    if (this._destroyed === false) this._refs++
    return this
  }

  _unref() {
    if (this._refs === 0) {
      throw new Error('Cannot unreference object with no active references')
    }

    if (--this._refs === 0 && this._destroyed === true) this._destroy()
    return this
  }

  _destroy() {}

  destroy() {
    if (this._refs !== 0) {
      throw new Error('Cannot destroy object with active references')
    }

    if (this._destroyed === true) {
      throw new Error('Object has already been destroyed')
    }

    this._destroyed = true
    this._destroy()
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
