const Decoder = require('./decoder')
const Encoder = require('./encoder')

const codecs = new Map()

module.exports = class FFmpegCodec {
  constructor(id) {
    this._id = id
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

  static for(id) {
    let codec = codecs.get(id)
    if (codec === undefined) {
      codec = new FFmpegCodec(id)
      codecs.set(id, codec)
    }
    return codec
  }
}
