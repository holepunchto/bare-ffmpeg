const binding = require('../binding')

module.exports = class HWDeviceContext {
  constructor(type, device = null) {
    this._handle = binding.initHWDeviceContext(type, device)
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
