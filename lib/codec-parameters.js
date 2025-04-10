const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegCodecParameters extends ReferenceCounted {
  constructor(handle) {
    super()

    this._handle = handle
  }

  _destroy() {
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

  fromContext(context) {
    binding.codecParametersFromContext(this._handle, context._handle)
  }

  toContext(context) {
    binding.codecParametersToContext(context._handle, this._handle)
  }
}
