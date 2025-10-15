const binding = require('../binding')
const ffmpeg = require('..')

module.exports = class FFmpegDecoder {
  constructor(codec) {
    this._codec = codec
    this._handle = binding.findDecoderByID(codec._id)
  }

  getHardwareConfigAt(index) {
    const handle = binding.getCodecHardwareConfig(this._handle, index)
    if (!handle) return null
    return new ffmpeg.CodecHWConfig(handle)
  }
}
