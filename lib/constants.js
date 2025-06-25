const binding = require('../binding')
const errors = require('./errors')
const ChannelLayout = require('./channel-layout')

module.exports = exports = {
  codecs: {
    MJPEG: binding.AV_CODEC_ID_MJPEG,
    H264: binding.AV_CODEC_ID_H264,
    AAC: binding.AV_CODEC_ID_AAC,
    OPUS: binding.AV_CODEC_ID_OPUS,
    AV1: binding.AV_CODEC_ID_AV1
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
    S64: binding.AV_SAMPLE_FMT_S64,
    FLT: binding.AV_SAMPLE_FMT_FLT,
    DBL: binding.AV_SAMPLE_FMT_DBL,
    U8P: binding.AV_SAMPLE_FMT_U8P,
    S16P: binding.AV_SAMPLE_FMT_S16P,
    S32P: binding.AV_SAMPLE_FMT_S32P,
    S64P: binding.AV_SAMPLE_FMT_S64P,
    FLTP: binding.AV_SAMPLE_FMT_FLTP,
    DBLP: binding.AV_SAMPLE_FMT_DBLP,
    NB: binding.AV_SAMPLE_FMT_NB
  },
  channelLayouts: {
    MONO: binding.AV_CH_LAYOUT_MONO,
    STEREO: binding.AV_CH_LAYOUT_STEREO,
    QUAD: binding.AV_CH_LAYOUT_QUAD,
    SURROUND: binding.AV_CH_LAYOUT_SURROUND,
    2_1: binding.AV_CH_LAYOUT_2POINT1,
    5_0: binding.AV_CH_LAYOUT_5POINT0,
    5_1: binding.AV_CH_LAYOUT_5POINT1,
    7_1: binding.AV_CH_LAYOUT_7POINT1,
    // Aliases
    2.1: binding.AV_CH_LAYOUT_2POINT1,
    '5.0': binding.AV_CH_LAYOUT_5POINT0,
    5.1: binding.AV_CH_LAYOUT_5POINT1,
    7.1: binding.AV_CH_LAYOUT_7POINT1
  }
}

exports.toPixelFormat = function toPixelFormat(format) {
  if (typeof format === 'number') return format

  if (typeof format === 'string') {
    if (format in exports.pixelFormats === false) {
      throw errors.UNKNOWN_PIXEL_FORMAT(`Unknown pixel format '${format}'`)
    }

    return exports.pixelFormats[format]
  }

  throw new TypeError(
    `Pixel format must be a number or string. Received ${typeof format} (${format})`
  )
}

exports.toSampleFormat = function toSampleFormat(format) {
  if (typeof format === 'number') return format

  if (typeof format === 'string') {
    if (format in exports.sampleFormats === false) {
      throw errors.UNKNOWN_SAMPLE_FORMAT(`Unknown sample format '${format}'`)
    }

    return exports.sampleFormats[format]
  }

  throw new TypeError(
    `Sample format must be a number or string. Received ${typeof format} (${format})`
  )
}

exports.toChannelLayout = function toChannelLayout(layout) {
  if (typeof layout === 'object' && layout !== null) return layout

  if (typeof layout === 'number') {
    return new ChannelLayout(binding.channelLayoutFromMask(layout))
  }

  if (typeof layout === 'string') {
    if (layout in exports.channelLayouts === false) {
      throw errors.UNKNOWN_CHANNEL_LAYOUT(`Unknown channel layout '${layout}'`)
    }

    return toChannelLayout(exports.channelLayouts[layout])
  }

  throw new TypeError(
    `Channel layout must be a number or string. Received ${typeof layout} (${layout})`
  )
}
