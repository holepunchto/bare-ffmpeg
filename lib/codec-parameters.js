const binding = require('../binding')

module.exports = class FFmpegCodecParameters {
  constructor(handle) {
    this._handle = handle
  }

  destroy() {
    this._handle = null
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

  get sampleRate() {
    return binding.getCodecParametersSampleRate(this._handle)
  }

  get channels() {
    return binding.getCodecParametersChannels(this._handle)
  }

  get codecType() {
    return binding.getCodecParametersCodecType(this._handle)
  }

  get channelLayout() {
    return binding.getCodecParametersChannelLayout(this._handle)
  }

  fromContext(context) {
    binding.codecParametersFromContext(this._handle, context._handle)
  }

  toContext(context) {
    binding.codecParametersToContext(context._handle, this._handle)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
