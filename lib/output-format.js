const binding = require('../binding')

module.exports = class FFmpegOutputFormat {
  constructor(name, handle) {
    if (!handle && typeof name !== 'string') {
      throw new TypeError(`Output format name must be a string. Received ${typeof name} (${name})`)
    }

    if (handle) this._handle = handle
    else this._handle = binding.initOutputFormat(name)
  }

  static from(handle) {
    return new FFmpegOutputFormat(null, handle)
  }

  static listDevices(name, opts = {}) {
    const { mediaType = null } = opts

    const format = new FFmpegOutputFormat(name)
    const devices = binding.listOutputFormatDevices(format._handle).map(toDevice)

    if (mediaType === null) return devices

    return devices.filter((device) => device.mediaTypes.includes(mediaType))
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

  get name() {
    return binding.getOutputFormatName(this._handle)
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegOutputFormat },
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
