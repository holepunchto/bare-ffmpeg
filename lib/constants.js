const binding = require('../binding')

module.exports = exports = {
  codecs: {
    MJPEG: binding.AV_CODEC_ID_MJPEG,
    H264: binding.AV_CODEC_ID_H264
  },
  pixelFormats: {
    RGBA: binding.AV_PIX_FMT_RGBA,
    RGB24: binding.AV_PIX_FMT_RGB24,
    YUVJ420P: binding.AV_PIX_FMT_YUVJ420P,
    UYVY422: binding.AV_PIX_FMT_UYVY422,
    YUV420P: binding.AV_PIX_FMT_YUV420P
  },
  mediaTypes: {
    UNKNOWN: binding.AVMEDIA_TYPE_UNKNOWN,
    VIDEO: binding.AVMEDIA_TYPE_VIDEO,
    AUDIO: binding.AVMEDIA_TYPE_AUDIO,
    DATA: binding.AVMEDIA_TYPE_DATA,
    SUBTITLE: binding.AVMEDIA_TYPE_SUBTITLE,
    ATTACHEMENT: binding.AVMEDIA_TYPE_ATTACHMENT,
    NB: binding.AVMEDIA_TYPE_NB
  },
  sampleFormats: {
    NONE: binding.AV_SAMPLE_FMT_NONE,
    U8: binding.AV_SAMPLE_FMT_U8,
    S16: binding.AV_SAMPLE_FMT_S16,
    S32: binding.AV_SAMPLE_FMT_S32,
    FLT: binding.AV_SAMPLE_FMT_FLT,
    FLTP: binding.AV_SAMPLE_FMT_FLTP,
    DBL: binding.AV_SAMPLE_FMT_DBL,
    U8P: binding.AV_SAMPLE_FMT_U8P,
    S16P: binding.AV_SAMPLE_FMT_S16P,
    S32P: binding.AV_SAMPLE_FMT_S32P,
    DBLP: binding.AV_SAMPLE_FMT_DBLP,
    S64: binding.AV_SAMPLE_FMT_S64,
    S64P: binding.AV_SAMPLE_FMT_S64P,
    NB: binding.AV_SAMPLE_FMT_NB
  },
  channelLayouts: {
    MONO: binding.AV_CH_LAYOUT_MONO,
    STEREO: binding.AV_CH_LAYOUT_STEREO
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
