const binding = require('../binding')

module.exports = class FFmpegSamples {
  _data
  _frame

  constructor({ noAlignment = false } = {}) {
    this._noAlignment = noAlignment
  }

  get data() {
    return this._data
  }

  get format() {
    return this._frame.format
  }

  get channelLayout() {
    return this._frame.channelLayout
  }

  get nbSamples() {
    return this._frame.nbSamples
  }

  get nbChannels() {
    return this.channelLayout && this.channelLayout.nbChannels
  }

  get pts() {
    return this._frame.pts
  }

  fill(frame) {
    const { format, channelLayout, nbSamples } = frame

    const len = FFmpegSamples.bufferSize(
      format,
      channelLayout.nbChannels,
      nbSamples,
      this._noAlignment
    )

    if (!this._data || len !== this._data.length) {
      this._data = Buffer.allocUnsafe(len)
    }

    const res = binding.fillSamples(
      frame._handle,
      this._data.buffer,
      this._data.byteOffset,
      this._noAlignment
    )

    this._frame = frame

    return res
  }

  read(frame) {
    const { format, channelLayout, nbSamples } = frame

    const len = FFmpegSamples.bufferSize(
      format,
      channelLayout.nbChannels,
      nbSamples,
      this._noAlignment
    )

    if (!this._data || len !== this._data.length) {
      this._data = Buffer.allocUnsafe(len)
    }

    binding.readSamples(frame._handle, this._data.buffer, this._data.byteOffset, this._noAlignment)
  }

  copy(frame, dstOffset = 0, srcOffset = 0) {
    binding.copySamples(frame._handle, this._frame._handle, dstOffset, srcOffset, this.nbSamples)
  }

  static bufferSize(format, nbChannels, nbSamples, noAlignment = false) {
    return binding.samplesBufferSize(format, nbChannels, nbSamples, noAlignment)
  }
}
