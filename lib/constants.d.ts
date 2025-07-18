declare const constants: {
  codecs: {
    MJPEG: number
    H264: number
    AAC: number
    OPUS: number
    AV1: number
  }
  pixelFormats: {
    RGBA: number
    RGB24: number
    YUVJ420P: number
    UYVY422: number
    YUV420P: number
  }
  mediaTypes: {
    UNKNOWN: number
    VIDEO: number
    AUDIO: number
    DATA: number
    SUBTITLE: number
    ATTACHEMENT: number
    NB: number
  }
  sampleFormats: {
    NONE: number
    U8: number
    S16: number
    S32: number
    S64: number
    FLT: number
    DBL: number
    U8P: number
    S16P: number
    S32P: number
    S64P: number
    FLTP: number
    DBLP: number
    NB: number
  }
  channelLayouts: {
    MONO: number
    STEREO: number
    QUAD: number
    SURROUND: number
    2_1: number
    5_0: number
    5_1: number
    7_1: number
    // Aliases
    2.1: number
    '5.0': number
    5.1: number
    7.1: number
  }
  pictureTypes: {
    NONE: number
    I: number
    P: number
    B: number
    S: number
    SI: number
    SP: number
    BI: number
  }
}

export function toPixelFormat(format: string | number): number

export function toSampleFormat(format: string | number): number

export function toChannelLayout(layout: string | number): number

export default constants
