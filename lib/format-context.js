const binding = require('../binding')
const Stream = require('./stream.js')

module.exports = class FFmpegFormatContext {
  constructor(io) {
    this._io = io
    this._streams = []
    this._handle = binding.initFormatContext(io._handle)

    for (const handle of binding.getFormatContextStreams(this._handle)) {
      this._streams.push(new Stream(handle))
    }
  }

  get io() {
    return this._io
  }

  get streams() {
    return this._streams
  }

  destroy() {
    if (this._handle === null) return
    binding.destroyFormatContext(this._handle)
    this._io = null
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  readFrame(packet) {
    binding.readFormatContextFrame(this._handle, packet._handle)
  }
}
