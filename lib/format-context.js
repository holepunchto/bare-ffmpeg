const binding = require('../binding')
const Stream = require('./stream.js')
const OutputFormat = require('./output-format')
const IOContext = require('./io-context')
const InputFormat = require('./input-format')
const Dictionary = require('./dictionary')
/** @typedef {import('./packet')} Packet */

class FFmpegFormatContext {
  constructor(io) {
    this._io = io
    this._streams = []
  }

  destroy() {
    if (this._io) {
      this._io.destroy()
      this._io = null
    }
  }

  get io() {
    return this._io
  }

  get streams() {
    return this._streams
  }

  readFrame(packet) {
    return binding.readFormatContextFrame(this._handle, packet._handle)
  }

  getBestStreamIndex(type) {
    return binding.getFormatContextBestStreamIndex(this._handle, type)
  }

  getStream(index) {
    if (index < 0 || index >= this._streams.length) {
      return null
    }

    return this._streams[index]
  }

  /** @returns {Stream|null} */
  getBestStream(type) {
    if (this._streams.length === 0) {
      return null
    }

    const bestIndex = binding.getFormatContextBestStreamIndex(
      this._handle,
      type
    )

    if (bestIndex < 0 || bestIndex >= this._streams.length) {
      return null
    }

    return this._streams[bestIndex]
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}

let defaultURL = null

switch (Bare.platform) {
  case 'darwin':
  case 'ios':
    defaultURL = '0:0'
    break
  case 'linux':
    // TODO: test on real machine
    // we might need separate contexts for linux
    // video: V4L2 and audio: ALSA/PulseAudio
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

      options = options || new Dictionary()

      this._handle = binding.openInputFormatContextWithFormat(
        io._handle,
        options._handle,
        url
      )

      options.destroy()
    }

    for (const handle of binding.getFormatContextStreams(this._handle)) {
      this._streams.push(new Stream(handle))
    }
  }

  destroy() {
    super.destroy()

    binding.closeInputFormatContext(this._handle)
    this._handle = null
  }

  dump(printIdx = 0, printUrl = '') {
    binding.dumpFormatContext(this._handle, false, printIdx, printUrl)
  }

  get inputFormat() {
    const handle = binding.getFormatContextInputFormat(this._handle)
    if (handle) return InputFormat.from(handle)
  }
}

exports.OutputFormatContext = class FFmpegOutputFormatContext extends (
  FFmpegFormatContext
) {
  constructor(format, io) {
    super(io)

    if (typeof format === 'string') format = new OutputFormat(format)

    this._handle = binding.openOutputFormatContext(format._handle, io._handle)
    this._isOutput = true
  }

  destroy() {
    super.destroy()

    binding.closeOutputFormatContext(this._handle)
    this._handle = null
  }

  createStream() {
    const stream = new Stream(binding.createFormatContextStream(this._handle))

    this._streams.push(stream)

    return stream
  }

  /** @param {Dictionary} [options] format options */
  writeHeader(options) {
    binding.writeFormatContextHeader(this._handle, options?._handle)
  }

  /** @param {Packet} packet */
  writeFrame(packet) {
    binding.writeFormatContextFrame(this._handle, packet._handle)
  }

  writeTrailer() {
    binding.writeFormatContextTrailer(this._handle)
  }

  dump(printIdx = 0, printUrl = '') {
    binding.dumpFormatContext(this._handle, true, printIdx, printUrl)
  }

  get outputFormat() {
    const handle = binding.getFormatContextOutputFormat(this._handle)
    if (handle) return OutputFormat.from(handle)
  }
}
