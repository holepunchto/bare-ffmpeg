const binding = require('../binding')

module.exports = class FFmpegEncoder {
  constructor(codec) {
    this._codec = codec
    this._handle = binding.findEncoderByID(codec._id)
  }

  /**
   * Find an encoder by name (e.g., 'libvpx', 'libvpx-vp9', 'h264_videotoolbox')
   * @param {string} name - The encoder name
   * @return {FFmpegEncoder}
   */
  static byName(name) {
    const encoder = Object.create(FFmpegEncoder.prototype)
    encoder._codec = { name }
    encoder._handle = binding.findEncoderByName(name)
    return encoder
  }
}
