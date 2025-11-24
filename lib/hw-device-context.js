const binding = require('../binding')

module.exports = class HWDeviceContext {
  constructor(type, device = undefined, handle = undefined) {
    if (handle) {
      this._handle = handle
    } else {
      this._handle = binding.initHWDeviceContext(type, device)
    }
  }

  static from(handle) {
    if (handle == null) return null
    return new HWDeviceContext(null, undefined, handle)
  }

  destroy() {
    binding.destroyHWDeviceContext(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: HWDeviceContext }
    }
  }
}
