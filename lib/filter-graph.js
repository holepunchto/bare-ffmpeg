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
      args ?? undefined
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

  pullFrame(ctx, frame) {
    return binding.pullFilterGraphFrame(ctx._handle, frame._handle)
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
