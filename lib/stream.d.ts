import FFmpegCodec from './codec'
import FFmpegCodecContext from './codec-context'
import FFmpegCodecParameters from './codec-parameters'

declare class FFmpegStream {
  readonly codec: FFmpegCodec
  readonly codecParameters: FFmpegCodecParameters

  constructor(handle: ArrayBuffer)

  decoder(): FFmpegCodecContext
  encoder(): FFmpegCodecContext

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegStream
