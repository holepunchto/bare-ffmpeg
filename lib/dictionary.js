const binding = require('../binding')

module.exports = class FFmpegDictionary {
  constructor() {
    this._handle = binding.initDictionary()
  }

  destroy() {
    binding.destroyDictionary(this._handle)
    this._handle = null
  }

  get(key) {
    const value = binding.getDictionaryEntry(this._handle, key)
    if (value === undefined) return null
    return value
  }

  set(key, value) {
    if (typeof value === 'number') value = String(value)

    binding.setDictionaryEntry(this._handle, key, value)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
