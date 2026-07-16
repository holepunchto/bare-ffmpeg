const binding = require('../binding')
const { optionFlags } = require('./constants')

module.exports = class FilterContext {
  constructor() {
    this._handle = binding.initFilterContext()
  }

  getOption(name, flags = optionFlags.SEARCH_CHILDREN) {
    return binding.getOption(this._handle, name, flags)
  }

  setOption(name, value, flags = optionFlags.SEARCH_CHILDREN) {
    binding.setOption(this._handle, name, value, flags)
  }

  setOptionDictionary(dictionary, flags = optionFlags.SEARCH_CHILDREN) {
    binding.setOptionDictionary(this._handle, dictionary._handle, flags)
  }

  setOptionDefaults() {
    binding.setOptionDefaults(this._handle)
  }

  listOptionNames(flags = optionFlags.SEARCH_CHILDREN) {
    return binding.listOptionNames(this._handle, flags)
  }

  getOptions(flags = optionFlags.SEARCH_CHILDREN) {
    const options = {}

    for (const name of this.listOptionNames(flags)) {
      try {
        options[name] = this.getOption(name, flags)
      } catch (error) {
        // Non-string options are currently ignored to match CodecContext behaviour.
      }
    }

    return options
  }
}
