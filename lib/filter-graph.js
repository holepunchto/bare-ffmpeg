const binding = require('../binding')

module.exports = class FFmpegFilterGraph {
  constructor(
    filterDescription,
    width,
    height,
    pixelFormat,
    timeBase,
    aspectRatio
  ) {
    // TODO: validation
    this._handle = binding.initFilterGraph(
      filterDescription,
      width,
      height,
      pixelFormat,
      timeBase.numerator,
      timeBase.denominator,
      aspectRatio.numerator,
      aspectRatio.denominator
    )
  }

  destroy() {
    binding.destroyFilterGraph(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
