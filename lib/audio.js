const binding = require('../binding')
const constants = require('./constants.js')

module.exports = class FFmpegAudio {
  constructor(format, nbChannels, nbSamples, align = 1) {
    this._sampleFormat = constants.toSampleFormat(format)
    this._nbChannels = nbChannels
    this._nbSamples = nbSamples
    this._align = align

    this._data = Buffer.from(
      binding.initAudio(this._sampleFormat, nbChannels, nbSamples, align)
    )
  }

  get data() {
    return this._data
  }

  fill(frame) {
    binding.fillAudio(
      frame._handle,
      this._data.buffer,
      this._data.byteOffset,
      this._data.byteLength
    )
  }

  getBuffer(frame, plane = 0) {
    return binding.getFrameAudioChannel(frame._handle)
  }

  getBufferSize(nbSamples, format, channelLayout, align = 1) {
    const layout = constants.toChannelLayout(channelLayout)
    return binding.getAudioBufferSize(
      layout.nb_channels,
      nbSamples,
      format,
      align
    )
  }

  static getBuffer(frame, plane = 0) {
    return binding.getFrameAudioChannel(frame._handle)
  }

  static getBufferSize(nbSamples, sampleFmt, channelLayout, align = 1) {
    const fmt = constants.toSampleFormat(sampleFmt)
    const layout = constants.toChannelLayout(channelLayout)
    return binding.getAudioBufferSize(layout.nb_channels, nbSamples, fmt, align)
  }

  static lineSize(sampleFmt, channelLayout, nbSamples, plane = 0) {
    const fmt = constants.toSampleFormat(sampleFmt)
    const layout = constants.toChannelLayout(channelLayout)
    return binding.getAudioLineSize(fmt, layout.nb_channels, nbSamples, plane)
  }
}
