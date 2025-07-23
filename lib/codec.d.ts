import FFmpegDecoder from './decoder'
import FFmpegEncoder from './encoder'

declare class FFmpegCodec {
  readonly id: number
  readonly decoder: FFmpegDecoder
  readonly encoder: FFmpegEncoder

  constructor(id: number)

  static for(id: number): FFmpegCodec

  static MJPEG: FFmpegCodec
  static H264: FFmpegCodec
  static AAC: FFmpegCodec
  static OPUS: FFmpegCodec
  static AV1: FFmpegCodec
}

export = FFmpegCodec
