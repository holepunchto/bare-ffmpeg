const binding = require('../binding')
const Rational = require('./rational')
const ChannelLayout = require('./channel-layout')
const Dictionary = require('./dictionary')

// One `av_opt_set_*()` per type of value, as the C API has them. A string is
// parsed by FFmpeg according to the type of the option, which covers the types
// that have no value of their own here, such as an image size, `'1920x1080'`.
module.exports = function setOption(handle, name, value, flags) {
  if (typeof value === 'string') {
    return binding.setOption(handle, name, value, flags)
  }

  if (typeof value === 'boolean') {
    return binding.setOptionInt(handle, name, value ? 1 : 0, flags)
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) return binding.setOptionInt(handle, name, value, flags)

    return binding.setOptionDouble(handle, name, value, flags)
  }

  if (value instanceof Rational) {
    return binding.setOptionRational(handle, name, value.numerator, value.denominator, flags)
  }

  if (value instanceof ChannelLayout) {
    return binding.setOptionChannelLayout(handle, name, value._handle, flags)
  }

  if (value instanceof Dictionary) {
    return binding.setOptionDictionaryValue(handle, name, value._handle, flags)
  }

  if (ArrayBuffer.isView(value)) {
    return binding.setOptionBinary(
      handle,
      name,
      value.buffer,
      value.byteOffset,
      value.byteLength,
      flags
    )
  }

  throw new TypeError(
    `Option value must be a string, number, boolean, Rational, ChannelLayout, Dictionary or Buffer. Received ${typeof value}`
  )
}
