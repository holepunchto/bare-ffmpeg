const binding = require('../binding')
const Rational = require('./rational')
const ChannelLayout = require('./channel-layout')
const { codecConfig } = require('./constants')

// `avcodec_get_supported_config()` takes a context, a codec, or both.
module.exports = function supportedConfig(context, codec, config) {
  if (config === codecConfig.FRAME_RATE) {
    const data = binding.getSupportedFrameRates(context, codec)
    if (!data || data.length === 0) return null

    const view = new Int32Array(data)
    const rates = []
    for (let i = 0; i < view.length; i += 2) {
      rates.push(new Rational(view[i], view[i + 1]))
    }
    return rates
  }

  if (config === codecConfig.CHANNEL_LAYOUT) {
    const handles = binding.getSupportedChannelLayouts(context, codec)
    if (!handles || handles.length === 0) return null

    return handles.map((handle) => new ChannelLayout(handle))
  }

  const data = binding.getSupportedConfig(context, codec, config)

  if (config === codecConfig.SAMPLE_RATE && !data) return null

  return new Int32Array(data)
}
