const binding = require('../binding')
const Codec = require('./codec')
const CodecContext = require('./codec-context')
const CodecParameters = require('./codec-parameters')

module.exports = class FFmpegStream {
  constructor(handle) {
    this._handle = handle

    this._codec = Codec.for(binding.getStreamCodec(this._handle))

    this._codecParameters = new CodecParameters(
      binding.getStreamCodecParameters(this._handle)
    )
  }

  get id() {
    return binding.getStreamId(this._handle)
  }

  get index() {
    return binding.getStreamIndex(this._handle)
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
