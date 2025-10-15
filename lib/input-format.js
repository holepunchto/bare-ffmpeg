const binding = require('../binding')

let defaultName = null

switch (Bare.platform) {
  case 'android':
    defaultName = 'android_camera'
    break
  case 'darwin':
  case 'ios':
    defaultName = 'avfoundation'
    break
  case 'linux':
    defaultName = 'v4l2'
    break
  case 'win32':
    defaultName = 'dshow'
    break
}

module.exports = class FFmpegInputFormat {
  constructor(name = defaultName, handle) {
    if (handle) this._handle = handle
    else this._handle = binding.initInputFormat(name)
  }

  static from(handle) {
    return new FFmpegInputFormat(null, handle)
  }

  get flags() {
    return binding.getInputFormatFlags(this._handle)
  }

  get extensions() {
    return binding.getInputFormatExtensions(this._handle)
  }

  get mimeType() {
    return binding.getInputFormatMimeType(this._handle)
  }

  get name() {
    return binding.getInputFormatName(this._handle)
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegInputFormat },
      name: this.name,
      flags: this.flags,
      extensions: this.extensions,
      mimeType: this.mimeType
    }
  }
}
