const binding = require('../binding')

module.exports = class FFmpegDecoder {
  constructor(codec) {
    this._codec = codec
    this._handle = binding.findDecoderByID(codec._id)
  }

  /**
   * Find a decoder by name (e.g., 'libvpx', 'h264')
   * @param {string} name - The decoder name
   * @return {FFmpegDecoder}
   */
  static byName(name) {
    const decoder = Object.create(FFmpegDecoder.prototype)
    decoder._codec = { name }
    decoder._handle = binding.findDecoderByName(name)
    return decoder
  }
}
