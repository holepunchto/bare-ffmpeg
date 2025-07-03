const binding = require('../binding')
const ChannelLayout = require('./channel-layout')

module.exports = class FFmpegCodecParameters {
  constructor(handle) {
    this._handle = handle
  }

  get bitRate() {
    return binding.getCodecParametersBitRate(this._handle)
  }

  get bitsPerCodedSample() {
    return binding.getCodecParametersBitsPerCodedSample(this._handle)
  }

  get bitsPerRawSample() {
    return binding.getCodecParametersBitsPerRawSample(this._handle)
  }

  get format() {
    return binding.getCodecParametersFormat(this._handle)
  }

  get sampleRate() {
    return binding.getCodecParametersSampleRate(this._handle)
  }

  get nbChannels() {
    return binding.getCodecParametersNbChannels(this._handle)
  }

  get codecType() {
    return binding.getCodecParametersCodecType(this._handle)
  }

  get channelLayout() {
    return new ChannelLayout(
      binding.getCodecParametersChannelLayout(this._handle)
    )
  }

  fromContext(context) {
    binding.codecParametersFromContext(this._handle, context._handle)
  }

  toContext(context) {
    binding.codecParametersToContext(context._handle, this._handle)
  }

  #inspect () {
    return [
      'bitRate',
      'bitsPerCodedSample',
      'bitsPerRawSample',
      'format',
      'sampleRate',
      'nbChannels',
      'codecType',
      'channelLayout'
    ].reduce((map, key) => {
      map[key] = this[key]
      return map
    }, {})
  }

  [Symbol.for('bare.inspect')]() { return this.#inspect() }
  [Symbol.for('nodejs.util.inspect.custom')]() { return this.#inspect() }
}
