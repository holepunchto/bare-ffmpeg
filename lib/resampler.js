const binding = require('../binding')
const ChannelLayout = require('./channel-layout')

class Resampler {
  constructor(
    inputSampleRate,
    inputChannelLayout,
    inputFormat,
    outputSampleRate,
    outputChannelLayout,
    outputFormat
  ) {
    inputChannelLayout = ChannelLayout.from(inputChannelLayout)
    outputChannelLayout = ChannelLayout.from(outputChannelLayout)

    this._inputSampleRate = inputSampleRate
    this._outputSampleRate = outputSampleRate

    this._handle = binding.initResampler(
      inputSampleRate,
      inputFormat,
      inputChannelLayout._handle,
      outputSampleRate,
      outputFormat,
      outputChannelLayout._handle
    )
  }

  get inputSampleRate() {
    return this._inputSampleRate
  }

  get outputSampleRate() {
    return this._outputSampleRate
  }

  get delay() {
    return binding.getResamplerDelay(this._handle, this._inputSampleRate)
  }

  convert(inputFrame, outputFrame) {
    return binding.convertResampler(
      this._handle,
      inputFrame._handle,
      outputFrame._handle
    )
  }

  flush(outputFrame) {
    return binding.flushResampler(this._handle, outputFrame._handle)
  }

  destroy() {
    binding.destroyResampler(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}

module.exports = Resampler
