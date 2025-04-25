const binding = require('../binding')

module.exports = exports = {
  codecs: {
    MJPEG: binding.AV_CODEC_ID_MJPEG
  },
  pixelFormats: {
    RGBA: binding.AV_PIX_FMT_RGBA,
    RGB24: binding.AV_PIX_FMT_RGB24,
    YUVJ420P: binding.AV_PIX_FMT_YUVJ420P,
    UYVY422: binding.AV_PIX_FMT_UYVY422,
    YUV420P: binding.AV_PIX_FMT_YUV420P
  },
  encoderMap: {
    h264: 'libx264'
  }
}

exports.toPixelFormat = function toPixelFormat(pixelFormat) {
  if (typeof pixelFormat === 'number') return pixelFormat

  if (typeof pixelFormat === 'string') {
    if (pixelFormat in exports.pixelFormats === false) {
      throw errors.UNKNOWN_PIXEL_FORMAT(`Unknown pixel format '${pixelFormat}'`)
    }

    return exports.pixelFormats[pixelFormat]
  }
}
