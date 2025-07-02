const binding = require('../binding')
const constants = require('./constants.js')

module.exports = class FFmpegImage {
  constructor(pixelFormat, width, height, align = 1) {
    pixelFormat = constants.toPixelFormat(pixelFormat)

    this._pixelFormat = pixelFormat
    this._width = width
    this._height = height
    this._align = align

    this._data = Buffer.from(
      binding.initImage(pixelFormat, width, height, align)
    )
  }

  get pixelFormat() {
    return this._pixelFormat
  }

  get width() {
    return this._width
  }

  get height() {
    return this._height
  }

  get align() {
    return this._align
  }

  get data() {
    return this._data
  }

  fill(frame) {
    binding.fillImage(
      this._pixelFormat,
      this._width,
      this._height,
      this._align,
      this._data.buffer,
      this._data.byteOffset,
      frame._handle
    )
  }

  extract(frame) {
    binding.extractImage(
      this._pixelFormat,
      this._width,
      this._height,
      this._align,
      frame._handle,
      this._data.buffer,
      this._data.byteOffset
    )
  }

  lineSize(plane = 0) {
    return binding.getImageLineSize(this._pixelFormat, this._width, plane)
  }

  static lineSize(pixelFormat, width, plane = 0) {
    return binding.getImageLineSize(pixelFormat, width, plane)
  }
}
