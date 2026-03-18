const binding = require('../binding')
const Codec = require('./codec')
const CodecContext = require('./codec-context')
const CodecParameters = require('./codec-parameters')
const Rational = require('./rational')
const SideData = require('./side-data')

module.exports = class FFmpegStream {
  constructor(handle) {
    this._handle = handle

    this._codecParameters = new CodecParameters(binding.getStreamCodecParameters(this._handle))
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
    return Codec.for(this.codecParameters.id)
  }

  get codecParameters() {
    return this._codecParameters
  }

  get sideData() {
    const handles = binding.getStreamSideData(this._handle)
    return handles.map((handle) => new SideData(handle))
  }

  get timeBase() {
    const view = new Int32Array(binding.getStreamTimeBase(this._handle))
    return new Rational(view[0], view[1])
  }

  set timeBase(value) {
    binding.setStreamTimeBase(this._handle, value.numerator, value.denominator)
  }

  get avgFramerate() {
    const view = new Int32Array(binding.getStreamAverageFramerate(this._handle))
    return new Rational(view[0], view[1])
  }

  set avgFramerate(value) {
    binding.setStreamAverageFramerate(this._handle, value.numerator, value.denominator)
  }

  get duration() {
    return binding.getStreamDuration(this._handle)
  }

  set duration(value) {
    binding.setStreamDuration(this._handle, value)
  }

  decoder() {
    const context = new CodecContext(this.codec.decoder)
    this._codecParameters.toContext(context)
    return context
  }

  encoder() {
    const context = new CodecContext(this.codec.encoder)
    this._codecParameters.toContext(context)
    return context
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegStream },
      id: this.id,
      index: this.index,
      sideData: this.sideData,
      timeBase: this.timeBase,
      avgFramerate: this.avgFramerate,
      codecParameters: this.codecParameters
    }
  }
}

module.exports.SideData = SideData
