const binding = require('../binding')
const Stream = require('./stream.js')
const ReferenceCounted = require('./reference-counted')
const OutputFormat = require('./output-format')
const IOContext = require('./io-context')
const InputFormat = require('./input-format')

class FFmpegFormatContext extends ReferenceCounted {
  constructor(io) {
    super()

    this._io = io ? io._ref() : null
    this._streams = []
  }

  _destroy() {
    if (this._io) {
      this._io._unref()
      this._io = null
    }

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

  // TODO: check type
  getBestStream(type) {
    if (this._streams.length == 0) {
      return null
    }

    const bestIndex = binding.getFormatContextBestStreamIndex(
      this._handle,
      type
    )

    if (this._streams[bestIndex]) {
      return this._streams[bestIndex]
    }

    return null
  }
}

let defaultURL = null

switch (Bare.platform) {
  case 'darwin':
    defaultURL = '0'
    break
  case 'linux':
    // TODO: test on real machine
    defaultURL = '/dev/video0'
    break
  case 'win32':
    defaultURL = 'video=Integrated Camera'
    break
}

exports.InputFormatContext = class FFmpegInputFormatContext extends (
  FFmpegFormatContext
) {
  constructor(io, options, url = defaultURL) {
    if (io instanceof IOContext) {
      super(io)
      this._handle = binding.openInputFormatContextWithIO(io._handle)
    } else if (io instanceof InputFormat) {
      super()
      this._handle = binding.openInputFormatContextWithFormat(
        io._handle,
        options._handle,
        url
      )
    }

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
