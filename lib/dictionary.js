const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class Dictionary extends ReferenceCounted {
  constructor() {
    super()

    this._handle = binding.initDictionary()
  }

  _destroy() {
    binding.destroyDictionary(this._handle)
    this._handle = null
  }

  set(key, value) {
    return binding.dictionarySet(this._handle, key, value)
  }

  get(key) {
    return binding.dictionaryGet(this._handle, key)
  }
}
