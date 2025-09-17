const binding = require('../binding')

module.exports = class FilterInOut {
  constructor(handle = binding.initFilterInout()) {
    this._handle = handle
    this._next = null
    this._filterContext = null
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
    return this._filterContext
  }

  set filterContext(value) {
    this._filterContext = value
    return binding.setFilterInOutFilterContext(
      this._handle,
      this._filterContext._handle
    )
  }

  get padIdx() {
    return binding.getFilterInOutPadIdx(this._handle)
  }

  set padIdx(value) {
    return binding.setFilterInOutPadIdx(this._handle, value)
  }

  get next() {
    return this._next
  }

  set next(value) {
    this._next = value
    return binding.setFilterInOutNext(this._handle, this._next._handle)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
