const binding = require('../binding')
const ReferenceCounted = require('./reference-counted')

module.exports = class Playback extends ReferenceCounted {
  constructor(height, width) {
    super()

    this._handle = binding.initPlayback(height, width)
  }

  _destroy() {
    this.stop()
    binding.destroyPlayback(this._handle)
    this._handle = null
  }

  unref() {
    this._unref()
  }

  render(frame) {
    return binding.playbackRenderFromFrame(this._handle, frame._handle)
  }

  poll() {
    return binding.pollPlaybackEvents(this._handle)
  }
}
