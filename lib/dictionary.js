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
    if (typeof key !== 'string' || key.length < 1) {
      throw new TypeError(`Key should be a non empty string`)
    }
    return binding.getDictionaryEntry(this._handle, key)
  }

  set(key, value) {
    if (typeof key !== 'string' || key.length < 1) {
      throw new TypeError(`Key should be a non empty string`)
    }

    if (typeof value !== 'string' || value.length < 1) {
      throw new TypeError(`Value should be a non empty string`)
    }
    binding.setDictionaryEntry(this._handle, key, value)
  }
}
