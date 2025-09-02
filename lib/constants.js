const binding = require('../binding')
const errors = require('./errors')

function makeTag(a, b, c, d) {
  return (
    a.charCodeAt(0) |
    (b.charCodeAt(0) << 8) |
    (c.charCodeAt(0) << 16) |
    (d.charCodeAt(0) << 24)
  )
}

module.exports = exports = {
  codecs: {
    MJPEG: binding.AV_CODEC_ID_MJPEG,
    AAC: binding.AV_CODEC_ID_AAC,
    OPUS: binding.AV_CODEC_ID_OPUS,
    AV1: binding.AV_CODEC_ID_AV1,
    FLAC: binding.AV_CODEC_ID_FLAC,
    MP3: binding.AV_CODEC_ID_MP3
  },
  tags: {
    MJPEG: makeTag('M', 'J', 'P', 'G'),
    AV1: makeTag('A', 'V', '0', '1'),
    AAC: 0x00ff,
    FLAC: 0xf1ac,
    MP3: 0x0055
  },
  profiles: {
    H264_MAIN: binding.AV_PROFILE_H264_MAIN
  },
  levels: {
    UNKNOWN: binding.AV_LEVEL_UNKNOWN
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
  },
  pictureTypes: {
    NONE: binding.AV_PICTURE_TYPE_NONE,
    I: binding.AV_PICTURE_TYPE_I,
    P: binding.AV_PICTURE_TYPE_P,
    B: binding.AV_PICTURE_TYPE_B,
    S: binding.AV_PICTURE_TYPE_S,
    SI: binding.AV_PICTURE_TYPE_SI,
    SP: binding.AV_PICTURE_TYPE_SP,
    BI: binding.AV_PICTURE_TYPE_BI
  },
  logLevels: {
    QUIET: binding.AV_LOG_QUIET,
    PANIC: binding.AV_LOG_PANIC,
    FATAL: binding.AV_LOG_FATAL,
    ERROR: binding.AV_LOG_ERROR,
    WARNING: binding.AV_LOG_WARNING,
    INFO: binding.AV_LOG_INFO,
    VERBOSE: binding.AV_LOG_VERBOSE,
    DEBUG: binding.AV_LOG_DEBUG,
    TRACE: binding.AV_LOG_TRACE
  },
  codecFlags: {
    COPY_OPAQUE: binding.AV_CODEC_FLAG_COPY_OPAQUE,
    FRAME_DURATION: binding.AV_CODEC_FLAG_FRAME_DURATION,
    PASS1: binding.AV_CODEC_FLAG_PASS1,
    PASS2: binding.AV_CODEC_FLAG_PASS2,
    LOOP_FILTER: binding.AV_CODEC_FLAG_LOOP_FILTER,
    GRAY: binding.AV_CODEC_FLAG_GRAY,
    PSNR: binding.AV_CODEC_FLAG_PSNR,
    INTERLACED_DCT: binding.AV_CODEC_FLAG_INTERLACED_DCT,
    LOW_DELAY: binding.AV_CODEC_FLAG_LOW_DELAY,
    GLOBAL_HEADER: binding.AV_CODEC_FLAG_GLOBAL_HEADER,
    BITEXACT: binding.AV_CODEC_FLAG_BITEXACT,
    AC_PRED: binding.AV_CODEC_FLAG_AC_PRED,
    INTERLACED_ME: binding.AV_CODEC_FLAG_INTERLACED_ME,
    CLOSED_GOP: binding.AV_CODEC_FLAG_CLOSED_GOP
  },
  formatFlags: {
    SHOW_IDS: binding.AVFMT_SHOW_IDS,
    GENERIC_INDEX: binding.AVFMT_GENERIC_INDEX,
    TS_DISCONT: binding.AVFMT_TS_DISCONT,
    NOBINSEARCH: binding.AVFMT_NOBINSEARCH,
    NOGENSEARCH: binding.AVFMT_NOGENSEARCH,
    NO_BYTE_SEEK: binding.AVFMT_NO_BYTE_SEEK,
    SEEK_TO_PTS: binding.AVFMT_SEEK_TO_PTS,
    GLOBALHEADER: binding.AVFMT_GLOBALHEADER,
    VARIABLE_FPS: binding.AVFMT_VARIABLE_FPS,
    NODIMENSIONS: binding.AVFMT_NODIMENSIONS,
    NOSTREAMS: binding.AVFMT_NOSTREAMS,
    TS_NONSTRICT: binding.AVFMT_TS_NONSTRICT,
    TS_NEGATIVE: binding.AVFMT_TS_NEGATIVE,
    NOFILE: binding.AVFMT_NOFILE,
    NEEDNUMBER: binding.AVFMT_NEEDNUMBER,
    NOTIMESTAMPS: binding.AVFMT_NOTIMESTAMPS
  },
  seek: {
    AVSEEK_SIZE: binding.AVSEEK_SIZE,
    AVSEEK_FORCE: binding.AVSEEK_FORCE,
    SEEK_CUR: binding.SEEK_CUR,
    SEEK_SET: binding.SEEK_SET,
    SEEK_END: binding.SEEK_END
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
  if (typeof layout === 'number') return layout

  if (typeof layout === 'string') {
    if (layout in exports.channelLayouts === false) {
      throw errors.UNKNOWN_CHANNEL_LAYOUT(`Unknown channel layout '${layout}'`)
    }

    return exports.channelLayouts[layout]
  }

  throw new TypeError(
    `Channel layout must be a number or string. Received ${typeof layout} (${layout})`
  )
}
