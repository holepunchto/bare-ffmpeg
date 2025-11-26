const binding = require('../binding')

module.exports = class HWFramesContext {
  constructor(hwDeviceContext, format, swFormat, width, height, handle = undefined) {
    if (handle) {
      this._handle = handle
      return
    }

    this._handle = binding.initHWFramesContext(
      hwDeviceContext._handle,
      format,
      swFormat,
      width,
      height
    )
  }

  static from(handle) {
    if (handle == null) return null
    return new HWFramesContext(null, null, null, null, null, handle)
  }

  get format() {
    return binding.getHWFramesContextFormat(this._handle)
  }

  set format(value) {
    binding.setHWFramesContextFormat(this._handle, value)
  }

  get swFormat() {
    return binding.getHWFramesContextSWFormat(this._handle)
  }

  set swFormat(value) {
    binding.setHWFramesContextSWFormat(this._handle, value)
  }

  get width() {
    return binding.getHWFramesContextWidth(this._handle)
  }

  set width(value) {
    binding.setHWFramesContextWidth(this._handle, value)
  }

  get height() {
    return binding.getHWFramesContextHeight(this._handle)
  }

  set height(value) {
    binding.setHWFramesContextHeight(this._handle, value)
  }

  destroy() {
    binding.destroyHWFramesContext(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: HWFramesContext },
      format: this.format,
      swFormat: this.swFormat,
      width: this.width,
      height: this.height
    }
  }
}
