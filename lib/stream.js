const binding = require('../binding')
const Codec = require('./codec')
const CodecContext = require('./codec-context')
const CodecParameters = require('./codec-parameters')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegStream extends ReferenceCounted {
  constructor(handle) {
    super()

    this._handle = handle

    this._codec = Codec.for(binding.getStreamCodec(this._handle))

    this._codecParameters = new CodecParameters(
      binding.getStreamCodecParameters(this._handle)
    )
  }

  _destroy() {
    this._codecParameters.destroy()
    this._codecParameters = null
  }

  get codec() {
    return this._codec
  }

  get codecParameters() {
    return this._codecParameters
  }

  decoder() {
    const context = new CodecContext(this._codec.decoder)
    this._codecParameters.toContext(context)
    return context.open()
  }

  encoder() {
    const context = new CodecContext(this._codec.encoder)
    this._codecParameters.toContext(context)
    return context.open()
  }
}
