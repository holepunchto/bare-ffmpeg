const binding = require('../binding')
const errors = require('./errors')

function makeTag(a, b, c, d) {
  return (
    a.charCodeAt(0) | (b.charCodeAt(0) << 8) | (c.charCodeAt(0) << 16) | (d.charCodeAt(0) << 24)
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
    NONE: binding.AV_PIX_FMT_NONE,
    RGBA: binding.AV_PIX_FMT_RGBA,
    RGB24: binding.AV_PIX_FMT_RGB24,
    YUVJ420P: binding.AV_PIX_FMT_YUVJ420P,
    UYVY422: binding.AV_PIX_FMT_UYVY422,
    YUV420P: binding.AV_PIX_FMT_YUV420P,
    NV12: binding.AV_PIX_FMT_NV12,
    NV21: binding.AV_PIX_FMT_NV21,
    NV24: binding.AV_PIX_FMT_NV24,
    VIDEOTOOLBOX: binding.AV_PIX_FMT_VIDEOTOOLBOX
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
    SIZE: binding.AVSEEK_SIZE,
    FORCE: binding.AVSEEK_FORCE,
    CUR: binding.SEEK_CUR,
    SET: binding.SEEK_SET,
    END: binding.SEEK_END
  },
  packetSideDataType: {
    PALETTE: binding.AV_PKT_DATA_PALETTE,
    NEW_EXTRADATA: binding.AV_PKT_DATA_NEW_EXTRADATA,
    PARAM_CHANGE: binding.AV_PKT_DATA_PARAM_CHANGE,
    H263_MB_INFO: binding.AV_PKT_DATA_H263_MB_INFO,
    REPLAYGAIN: binding.AV_PKT_DATA_REPLAYGAIN,
    DISPLAYMATRIX: binding.AV_PKT_DATA_DISPLAYMATRIX,
    STEREO3D: binding.AV_PKT_DATA_STEREO3D,
    AUDIO_SERVICE_TYPE: binding.AV_PKT_DATA_AUDIO_SERVICE_TYPE,
    QUALITY_STATS: binding.AV_PKT_DATA_QUALITY_STATS,
    FALLBACK_TRACK: binding.AV_PKT_DATA_FALLBACK_TRACK,
    CPB_PROPERTIES: binding.AV_PKT_DATA_CPB_PROPERTIES,
    SKIP_SAMPLES: binding.AV_PKT_DATA_SKIP_SAMPLES,
    JP_DUALMONO: binding.AV_PKT_DATA_JP_DUALMONO,
    STRINGS_METADATA: binding.AV_PKT_DATA_STRINGS_METADATA,
    SUBTITLE_POSITION: binding.AV_PKT_DATA_SUBTITLE_POSITION,
    MATROSKA_BLOCKADDITIONAL: binding.AV_PKT_DATA_MATROSKA_BLOCKADDITIONAL,
    WEBVTT_IDENTIFIER: binding.AV_PKT_DATA_WEBVTT_IDENTIFIER,
    WEBVTT_SETTINGS: binding.AV_PKT_DATA_WEBVTT_SETTINGS,
    METADATA_UPDATE: binding.AV_PKT_DATA_METADATA_UPDATE,
    MPEGTS_STREAM_ID: binding.AV_PKT_DATA_MPEGTS_STREAM_ID,
    MASTERING_DISPLAY_METADATA: binding.AV_PKT_DATA_MASTERING_DISPLAY_METADATA,
    SPHERICAL: binding.AV_PKT_DATA_SPHERICAL,
    CONTENT_LIGHT_LEVEL: binding.AV_PKT_DATA_CONTENT_LIGHT_LEVEL,
    A53_CC: binding.AV_PKT_DATA_A53_CC,
    ENCRYPTION_INIT_INFO: binding.AV_PKT_DATA_ENCRYPTION_INIT_INFO,
    ENCRYPTION_INFO: binding.AV_PKT_DATA_ENCRYPTION_INFO,
    AFD: binding.AV_PKT_DATA_AFD,
    PRFT: binding.AV_PKT_DATA_PRFT,
    ICC_PROFILE: binding.AV_PKT_DATA_ICC_PROFILE,
    DOVI_CONF: binding.AV_PKT_DATA_DOVI_CONF,
    S12M_TIMECODE: binding.AV_PKT_DATA_S12M_TIMECODE,
    DYNAMIC_HDR10_PLUS: binding.AV_PKT_DATA_DYNAMIC_HDR10_PLUS,
    IAMF_MIX_GAIN_PARAM: binding.AV_PKT_DATA_IAMF_MIX_GAIN_PARAM,
    IAMF_DEMIXING_INFO_PARAM: binding.AV_PKT_DATA_IAMF_DEMIXING_INFO_PARAM,
    IAMF_RECON_GAIN_INFO_PARAM: binding.AV_PKT_DATA_IAMF_RECON_GAIN_INFO_PARAM,
    AMBIENT_VIEWING_ENVIRONMENT: binding.AV_PKT_DATA_AMBIENT_VIEWING_ENVIRONMENT,
    FRAME_CROPPING: binding.AV_PKT_DATA_FRAME_CROPPING,
    LCEVC: binding.AV_PKT_DATA_LCEVC,
    '3D_REFERENCE_DISPLAYS': binding.AV_PKT_DATA_3D_REFERENCE_DISPLAYS,
    RTCP_SR: binding.AV_PKT_DATA_RTCP_SR,
    NB: binding.AV_PKT_DATA_NB
  },
  codecConfig: {
    PIX_FORMAT: binding.AV_CODEC_CONFIG_PIX_FORMAT,
    FRAME_RATE: binding.AV_CODEC_CONFIG_FRAME_RATE,
    SAMPLE_RATE: binding.AV_CODEC_CONFIG_SAMPLE_RATE,
    SAMPLE_FORMAT: binding.AV_CODEC_CONFIG_SAMPLE_FORMAT,
    CHANNEL_LAYOUT: binding.AV_CODEC_CONFIG_CHANNEL_LAYOUT,
    COLOR_RANGE: binding.AV_CODEC_CONFIG_COLOR_RANGE,
    COLOR_SPACE: binding.AV_CODEC_CONFIG_COLOR_SPACE
  },
  rounding: {
    AV_ROUND_ZERO: binding.AV_ROUND_ZERO,
    AV_ROUND_INF: binding.AV_ROUND_INF,
    AV_ROUND_DOWN: binding.AV_ROUND_DOWN,
    AV_ROUND_UP: binding.AV_ROUND_UP,
    AV_ROUND_NEAR_INF: binding.AV_ROUND_NEAR_INF,
    AV_ROUND_PASS_MINMAX: binding.AV_ROUND_PASS_MINMAX
  },
  optionFlags: {
    SEARCH_CHILDREN: binding.AV_OPT_SEARCH_CHILDREN,
    SEARCH_FAKE_OBJ: binding.AV_OPT_SEARCH_FAKE_OBJ,
    ALLOW_NULL: binding.AV_OPT_ALLOW_NULL,
    ARRAY_REPLACE: binding.AV_OPT_ARRAY_REPLACE,
    MULTI_COMPONENT_RANGE: binding.AV_OPT_MULTI_COMPONENT_RANGE
  },
  hwDeviceTypes: {
    VIDEOTOOLBOX: binding.AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
    CUDA: binding.AV_HWDEVICE_TYPE_CUDA,
    VAAPI: binding.AV_HWDEVICE_TYPE_VAAPI,
    DXVA2: binding.AV_HWDEVICE_TYPE_DXVA2,
    QSV: binding.AV_HWDEVICE_TYPE_QSV,
    D3D11VA: binding.AV_HWDEVICE_TYPE_D3D11VA
  },
  hwFrameMapFlags: {
    READ: binding.AV_HWFRAME_MAP_READ,
    WRITE: binding.AV_HWFRAME_MAP_WRITE,
    OVERWRITE: binding.AV_HWFRAME_MAP_OVERWRITE,
    DIRECT: binding.AV_HWFRAME_MAP_DIRECT
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

exports.getSampleFormatName = function (sampleFormat) {
  return binding.getSampleFormatNameByID(sampleFormat)
}

exports.getPixelFormatName = function (pixelFormat) {
  return binding.getPixelFormatNameByID(pixelFormat)
}
