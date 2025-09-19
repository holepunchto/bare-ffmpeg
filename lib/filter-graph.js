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
    const argumentsString =
      args &&
      `video_size=${args.width}x${args.height}` +
        `:pix_fmt=${args.pixelFormat}` +
        `:time_base=${args.timeBase.numerator}/${args.timeBase.denominator}` +
        `:pixel_aspect=${args.aspectRatio.numerator}/${args.aspectRatio.denominator}`

    return binding.createFilterGraphFilter(
      this._handle,
      context._handle,
      filter._handle,
      name,
      argumentsString
    )
  }

  parse(filterDescription, inputs, outputs) {
    binding.parseFilterGraph(
      this._handle,
      inputs._handle,
      outputs._handle,
      filterDescription
    )
  }

  configure() {
    binding.configureFilterGraph(this._handle)
  }

  pushFrame(ctx, frame) {
    return binding.pushFilterGraphFrame(ctx._handle, frame._handle)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
