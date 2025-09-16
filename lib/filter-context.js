const binding = require('../binding')

module.exports = class FilterContext {
  constructor() {
    this._handle = binding.initFilterContext()
  }
}
