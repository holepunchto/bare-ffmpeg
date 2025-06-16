const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegDictionary extends ReferenceCounted {
  constructor() {
    super()

    this._handle = binding.initDictionary()
  }

  _destroy() {
    binding.destroyDictionary(this._handle)
    this._handle = null
  }

  get(key) {
    const value = binding.getDictionaryEntry(this._handle, key)
    if (!value) return null
    return value
  }

  set(key, value) {
    binding.setDictionaryEntry(this._handle, key, value)
  }
}
