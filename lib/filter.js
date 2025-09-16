const binding = require('../binding')

module.exports = class Filter {
  constructor(name) {
    this._handle = binding.getFilterByName(name)
  }
}
