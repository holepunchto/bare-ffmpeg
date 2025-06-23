const binding = require('../binding')

class Resampler {
  constructor(
    inputSampleRate,
    inputChannelLayout,
    inputFormat,
    outputSampleRate,
    outputChannelLayout,
    outputFormat
  ) {
    this._handle = binding.initResampler(
      inputSampleRate,
      inputFormat,
      inputChannelLayout,
      outputSampleRate,
      outputFormat,
      outputChannelLayout
    )

    this.inputSampleRate = inputSampleRate
    this.outputSampleRate = outputSampleRate
  }

  convert(inputFrame, outputFrame) {
    return binding.convertResampler(
      this._handle,
      inputFrame._handle,
      outputFrame._handle
    )
  }

  get delay() {
    return binding.getResamplerDelay(this._handle, this.inputSampleRate)
  }

  flush(outputFrame) {
    return binding.flushResampler(this._handle, outputFrame._handle)
  }

  destroy() {
    if (this._handle) {
      binding.destroyResampler(this._handle)
      this._handle = null
    }
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}

module.exports = Resampler
