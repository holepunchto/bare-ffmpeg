const binding = require('../binding')

module.exports = exports = {
  codecs: {
    MJPEG: binding.AV_CODEC_ID_MJPEG,
    H264: binding.AV_CODEC_ID_H264
  },
  pixelFormats: {
    RGBA: binding.AV_PIX_FMT_RGBA,
    YUVJ420P: binding.AV_PIX_FMT_YUVJ420P,
    YUV420P: binding.AV_PIX_FMT_YUV420P
  },
  mediaType: {
    UNKNOWN: binding.AVMEDIA_TYPE_UNKNOWN,
    VIDEO: binding.AVMEDIA_TYPE_VIDEO,
    AUDIO: binding.AVMEDIA_TYPE_AUDIO,
    DATA: binding.AVMEDIA_TYPE_DATA,
    SUBTITLE: binding.AVMEDIA_TYPE_SUBTITLE,
    ATTACHEMENT: binding.AVMEDIA_TYPE_ATTACHMENT,
    NB: binding.AVMEDIA_TYPE_NB
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
