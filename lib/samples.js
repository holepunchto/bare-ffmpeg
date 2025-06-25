const binding = require('../binding')
const constants = require('./constants.js')

module.exports = class FFmpegSamples {
  constructor(sampleFormat, nbChannels, nbSamples, align = 0) {
    sampleFormat = constants.toSampleFormat(sampleFormat)

    this._sampleFormat = sampleFormat
    this._nbChannels = nbChannels
    this._nbSamples = nbSamples
    this._align = align

    this._data = Buffer.from(
      binding.initSamples(sampleFormat, nbChannels, nbSamples, align)
    )
  }

  get sampleFormat() {
    return this._sampleFormat
  }

  get nbChannels() {
    return this._nbChannels
  }

  get nbSamples() {
    return this._nbSamples
  }

  get align() {
    return this._align
  }

  get data() {
    return this._data
  }

  fill(frame) {
    binding.fillSamples(
      this._sampleFormat,
      this._nbChannels,
      this._nbSamples,
      this._align,
      this._data.buffer,
      this._data.byteOffset,
      frame._handle
    )
  }
}
