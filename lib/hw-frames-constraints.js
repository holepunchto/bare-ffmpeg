const binding = require('../binding')

module.exports = class HWFramesConstraints {
  constructor(handle) {
    this._handle = handle
  }

  get validSwFormats() {
    return binding.getHWFramesConstraintsValidSwFormats(this._handle)
  }

  get validHwFormats() {
    return binding.getHWFramesConstraintsValidHwFormats(this._handle)
  }

  get minWidth() {
    return binding.getHWFramesConstraintsMinWidth(this._handle)
  }

  get maxWidth() {
    return binding.getHWFramesConstraintsMaxWidth(this._handle)
  }

  get minHeight() {
    return binding.getHWFramesConstraintsMinHeight(this._handle)
  }

  get maxHeight() {
    return binding.getHWFramesConstraintsMaxHeight(this._handle)
  }

  // Note: HWFramesConstraints is independently allocated by FFmpeg and must be
  // explicitly freed. It is not owned by HWFramesContext.
  destroy() {
    binding.destroyHWFramesConstraints(this._handle)
    this._handle = null
  }

  [Symbol.dispose]() {
    this.destroy()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: HWFramesConstraints },
      validSwFormats: this.validSwFormats,
      validHwFormats: this.validHwFormats,
      minWidth: this.minWidth,
      maxWidth: this.maxWidth,
      minHeight: this.minHeight,
      maxHeight: this.maxHeight
    }
  }
}
