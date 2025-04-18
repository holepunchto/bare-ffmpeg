const binding = require('../binding')
const Stream = require('./stream.js')
const ReferenceCounted = require('./reference-counted')
const OutputFormat = require('./output-format')

class FFmpegFormatContext extends ReferenceCounted {
  constructor(io) {
    super()

    this._io = io._ref()
    this._streams = []
  }

  _destroy() {
    this._io._unref()
    this._io = null

    for (const stream of this._streams) stream.destroy()
    this._streams = []
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

exports.InputFormatContext = class FFmpegInputFormatContext extends (
  FFmpegFormatContext
) {
  constructor(io) {
    super(io)

    this._handle = binding.openInputFormatContext(io._handle)

    for (const handle of binding.getFormatContextStreams(this._handle)) {
      this._streams.push(new Stream(handle))
    }
  }

  _destroy() {
    super._destroy()

    binding.closeInputFormatContext(this._handle)
    this._handle = null
  }
}

exports.OutputFormatContext = class FFmpegOutputFormatContext extends (
  FFmpegFormatContext
) {
  constructor(format, io) {
    super(io)

    if (typeof format === 'string') format = new OutputFormat(format)

    this._handle = binding.openOutputFormatContext(format._handle, io._handle)
  }

  _destroy() {
    super._destroy()

    binding.closeOutputFormatContext(this._handle)
    this._handle = null
  }

  createStream(codec) {
    const stream = new Stream(
      binding.createFormatContextStream(this._handle, codec._handle)
    )

    this._streams.push(stream)

    return stream
  }
}
