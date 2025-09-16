const binding = require('../binding')

module.exports = class FilterInOut {
  constructor(handle = binding.initFilterInout()) {
    this._handle = handle
  }

  destroy() {
    binding.destroyFilterInOut(this._handle)
    this._handle = null
  }

  get name() {
    return binding.getFilterInOutName(this._handle)
  }

  set name(value) {
    return binding.setFilterInOutName(this._handle, value)
  }

  get filterContext() {
    const handle = binding.getFilterInOutFilterContext(this._handle)
    if (!handle) return null
    return new FilterInOut(handle)
  }

  set filterContext(value) {
    return binding.setFilterInOutFilterContext(this._handle, value._handle)
  }

  get padIdx() {
    return binding.getFilterInOutPadIdx(this._handle)
  }

  set padIdx(value) {
    return binding.setFilterInOutPadIdx(this._handle, value)
  }

  get next() {
    const handle = binding.getFilterInOutNext(this._handle)
    if (!handle) return null;
    return new FilterInOut(handle);
  }

  set next(value) {
    return binding.setFilterInOutNext(this._handle, value._handle)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
