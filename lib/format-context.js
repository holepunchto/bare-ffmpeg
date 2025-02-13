const binding = require('../binding')
const Stream = require('./stream.js')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegFormatContext extends ReferenceCounted {
  constructor(io) {
    super()

    this._io = io._ref()
    this._streams = []
    this._handle = binding.initFormatContext(io._handle)

    for (const handle of binding.getFormatContextStreams(this._handle)) {
      this._streams.push(new Stream(handle))
    }
  }

  _destroy() {
    this._io._unref()
    this._io = null

    for (const stream of this._streams) stream.destroy()
    this._streams = []

    binding.destroyFormatContext(this._handle)
    this._handle = null
  }

  get io() {
    return this._io
  }

  get streams() {
    return this._streams
  }

  readFrame(packet) {
    if (packet._refs !== 0) {
      throw new Error('Cannot read into packet with active references')
    }

    const result = binding.readFormatContextFrame(this._handle, packet._handle)
    if (result) packet._ref()
    return result
  }
}
