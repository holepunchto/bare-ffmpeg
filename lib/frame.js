const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegFrame extends ReferenceCounted {
  constructor() {
    super()

    this._handle = binding.initFrame()
  }

  _destroy() {
    binding.destroyFrame(this._handle)
    this._handle = null
  }

  channel(i) {
    if (i < 0 || i > 7) {
      throw new RangeError(`Channel index must be between 0 and 7`)
    }

    return Buffer.from(binding.getFrameChannel(this._handle, i))
  }
}
