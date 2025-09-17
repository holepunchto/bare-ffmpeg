const binding = require('../binding')

module.exports = class FilterGraph {
  constructor() {
    this._handle = binding.initFilterGraph()
  }

  destroy() {
    binding.destroyFilterGraph(this._handle)
    this._handle = null
  }

  createFilter(context, filter, name, args) {
    return binding.createFilterGraphFilter(
      this._handle,
      context._handle,
      filter._handle,
      name,
      args.width,
      args.height,
      args.pixelFormat,
      args.timeBase.numerator,
      args.timeBase.denominator,
      args.aspectRatio.numerator,
      args.aspectRatio.denominator
    )
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
