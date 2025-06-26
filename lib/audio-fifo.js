const binding = require('../binding')
const constants = require('./constants')

module.exports = class FFmpegAudioFifo {
  constructor(sampleFormat, channels, nbSamples) {
    sampleFormat = constants.toSampleFormat(sampleFormat)

    this._handle = binding.initAudioFifo(sampleFormat, channels, nbSamples)
  }

  destroy() {
    binding.destroyAudioFifo(this._handle)
    this._handle = null
  }

  write(frame) {
    return binding.writeAudioFifo(this._handle, frame._handle)
  }

  read(frame, nbSamples) {
    return binding.readAudioFifo(this._handle, frame._handle, nbSamples)
  }

  peek(frame, nbSamples) {
    return binding.peekAudioFifo(this._handle, frame._handle, nbSamples)
  }

  drain(nbSamples) {
    return binding.drainAudioFifo(this._handle, nbSamples)
  }

  reset() {
    binding.resetAudioFifo(this._handle)
  }

  get size() {
    return binding.getAudioFifoSize(this._handle)
  }

  get space() {
    return binding.getAudioFifoSpace(this._handle)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
