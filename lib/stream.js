const binding = require('../binding')
const Codec = require('./codec')
const CodecContext = require('./codec-context')
const CodecParameters = require('./codec-parameters')
const Rational = require('./rational')

module.exports = class FFmpegStream {
  constructor(handle) {
    this._handle = handle

    this._codecParameters = new CodecParameters(
      binding.getStreamCodecParameters(this._handle)
    )
  }

  get id() {
    return binding.getStreamId(this._handle)
  }

  set id(value) {
    binding.setStreamId(this._handle, value)
  }

  get index() {
    return binding.getStreamIndex(this._handle)
  }

  get codec() {
    return Codec.for(this.codecParameters.codecId)
  }

  get codecParameters() {
    return this._codecParameters
  }

  get timeBase() {
    const view = new Int32Array(binding.getStreamTimeBase(this._handle))
    return new Rational(view[0], view[1])
  }

  set timeBase(value) {
    binding.setStreamTimeBase(this._handle, value.numerator, value.denominator)
  }

  decoder() {
    const context = new CodecContext(this.codec.decoder)
    this._codecParameters.toContext(context)
    return context.open()
  }

  encoder() {
    const context = new CodecContext(this.codec.encoder)
    this._codecParameters.toContext(context)
    return context.open()
  }
}
