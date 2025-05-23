const binding = require('../binding')
const constants = require('./constants')
const ReferenceCounted = require('./reference-counted')

module.exports = class FFmpegScaler extends ReferenceCounted {
  constructor(
    sourcePixelFormat,
    sourceWidth,
    sourceHeight,
    targetPixelFormat,
    targetWidth,
    targetHeight
  ) {
    super()

    sourcePixelFormat = constants.toPixelFormat(sourcePixelFormat)
    targetPixelFormat = constants.toPixelFormat(targetPixelFormat)

    this._sourcePixelFormat = sourcePixelFormat
    this._sourceWidth = sourceWidth
    this._sourceHeight = sourceHeight
    this._targetPixelFormat = targetPixelFormat
    this._targetWidth = targetWidth
    this._targetHeight = targetHeight

    this._handle = binding.initScaler(
      sourcePixelFormat,
      sourceWidth,
      sourceHeight,
      targetPixelFormat,
      targetWidth,
      targetHeight
    )
  }

  _destroy() {
    binding.destroyScaler(this._handle)
    this._handle = null
  }

  scale(source, y, height, target) {
    if (typeof y !== 'number') {
      target = y
      y = 0
      height = this._targetHeight
    } else if (typeof height !== 'number') {
      target = height
      height = this._targetHeight
    }

    return binding.scaleScaler(
      this._handle,
      source._handle,
      y,
      height,
      target._handle
    )
  }
}
