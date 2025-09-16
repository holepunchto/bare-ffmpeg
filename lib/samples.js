const binding = require('../binding')

module.exports = class FFmpegSamples {
  _data
  #lastKnown = {}

  constructor({ noAlignment = false } = {}) {
    this._noAlignment = noAlignment
  }

  get data() {
    return this._data
  }

  get format() {
    return this.#lastKnown.format
  }

  get channelLayout() {
    return this.#lastKnown.channelLayout
  }

  get nbSamples() {
    return this.#lastKnown.nbSamples
  }

  get nbChannels() {
    return this.channelLayout && this.channelLayout.nbChannels
  }

  fill(frame) {
    const { format, channelLayout, nbSamples } = frame
    this.#lastKnown = { format, channelLayout, nbSamples }

    const len = FFmpegSamples.sizeOf(
      format,
      channelLayout.nbChannels,
      nbSamples,
      this._noAlignment
    )

    let reallocated = false

    if (!this._data || len !== this._data.length) {
      this._data = Buffer.allocUnsafe(len)
      reallocated = true
    }

    binding.fillSamples(
      frame._handle,
      this._data.buffer,
      this._data.byteOffset,
      this._data.byteLength,
      this._noAlignment
    )

    return reallocated
  }

  static sizeOf(format, nbChannels, nbSamples, noAlignment = false) {
    return binding.sizeofSamples(format, nbChannels, nbSamples, noAlignment)
  }
}
