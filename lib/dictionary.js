const binding = require('../binding')

module.exports = class FFmpegDictionary {
  static from(obj) {
    const dictionary = new FFmpegDictionary()

    for (const [key, value] of Object.entries(obj)) {
      dictionary.set(key, value)
    }

    return dictionary
  }

  constructor(handle) {
    if (handle) {
      this._handle = handle
    } else {
      this._handle = binding.initDictionary()
    }
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
    if (typeof value !== 'string') value = String(value)

    binding.setDictionaryEntry(this._handle, key, value)
  }

  entries() {
    return binding.getDictionaryEntries(this._handle)
  }

  *[Symbol.iterator]() {
    yield* this.entries()
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
