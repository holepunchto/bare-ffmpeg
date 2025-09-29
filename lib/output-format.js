const binding = require('../binding')

module.exports = class FFmpegOutputFormat {
  constructor(name, handle) {
    if (handle) this._handle = handle
    else this._handle = binding.initOutputFormat(name)
  }

  static from(handle) {
    return new FFmpegOutputFormat(null, handle)
  }

  get flags() {
    return binding.getOutputFormatFlags(this._handle)
  }

  get extensions() {
    return binding.getOutputFormatExtensions(this._handle)
  }

  get mimeType() {
    return binding.getOutputFormatMimeType(this._handle)
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegOutputFormat },
      flags: this.flags,
      extensions: this.extensions,
      mimeType: this.mimeType
    }
  }
}
