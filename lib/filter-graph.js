const binding = require('../binding')

module.exports = class FilterGraph {
  constructor() {
    this._handle = binding.initFilterGraph()
  }

  destroy() {
    binding.destroyFilterGraph(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
