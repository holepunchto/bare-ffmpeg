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

  pushFrame(frame) {
    return binding.pushFrameFilterGraph(this._handle, frame._handle)
  }

  pullFrame(frame) {
    return binding.pullFrameFilterGraph(this._handle, frame._handle)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
