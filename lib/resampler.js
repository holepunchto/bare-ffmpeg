const binding = require('../binding')

class Resampler {
  constructor(
    inputSampleRate,
    inputChannels,
    inputFormat,
    outputSampleRate,
    outputChannels,
    outputFormat
  ) {
    const inputLayout =
      inputChannels === 1
        ? binding.AV_CH_LAYOUT_MONO
        : binding.AV_CH_LAYOUT_STEREO

    const outputLayout =
      outputChannels === 1
        ? binding.AV_CH_LAYOUT_MONO
        : binding.AV_CH_LAYOUT_STEREO

    this._handle = binding.initResampler(
      inputSampleRate,
      inputFormat,
      inputLayout,
      outputSampleRate,
      outputFormat,
      outputLayout
    )

    this.inputSampleRate = inputSampleRate
    this.outputSampleRate = outputSampleRate
  }

  convert(inputFrame, outputFrame) {
    return binding.resampleResampler(
      this._handle,
      inputFrame._handle,
      outputFrame._handle
    )
  }

  getDelay() {
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
}

module.exports = Resampler
