const Decoder = require('./decoder')
const Encoder = require('./encoder')
const constants = require('./constants')
const binding = require('../binding')

const codecs = new Map()

module.exports = class FFmpegCodec {
  constructor(id, handle) {
    this._id = id
    this._handle = handle
    this._decoder = null
    this._encoder = null
  }

  get id() {
    return this._id
  }

  get decoder() {
    if (this._decoder === null) this._decoder = new Decoder(this)
    return this._decoder
  }

  get encoder() {
    if (this._encoder === null) this._encoder = new Encoder(this)
    return this._encoder
  }

  get name() {
    if (Number.isInteger(this._id)) {
      return binding.getCodecNameByID(this._id)
    }
  }

  get hardwareConfig() {
    return binding.getCodecHardwareConfig(this._handle)
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegCodec },
      id: this.id,
      name: this.name
    }
  }

  /** @return {FFmpegCodec} */
  static for(id) {
    let codec = codecs.get(id)
    if (codec === undefined) {
      codec = new FFmpegCodec(id)
      codecs.set(id, codec)
    }
    return codec
  }

  static MJPEG = this.for(constants.codecs.MJPEG)
  static AAC = this.for(constants.codecs.AAC)
  static OPUS = this.for(constants.codecs.OPUS)
  static AV1 = this.for(constants.codecs.AV1)
}
