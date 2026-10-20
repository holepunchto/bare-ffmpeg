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
    if (!handle && typeof name !== 'string') {
      throw new TypeError(`Input format name must be a string. Received ${typeof name} (${name})`)
    }

    if (handle) this._handle = handle
    else this._handle = binding.initInputFormat(name)
  }

  static from(handle) {
    return new FFmpegInputFormat(null, handle)
  }

  static listDevices(name, opts = {}) {
    const { mediaType = null } = opts

    const format = new FFmpegInputFormat(name)
    const devices = binding.listInputFormatDevices(format._handle).map(toDevice)

    if (mediaType === null) return devices

    return devices.filter((device) => device.mediaTypes.includes(mediaType))
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

function toDevice([name, description, isDefault, mediaTypes]) {
  return { name, description, default: isDefault, mediaTypes }
}
