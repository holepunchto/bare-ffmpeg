import FFmpegIOContext from './io-context'
import FFmpegStream from './stream'
import FFmpegPacket from './packet'
import FFmpegCodec from './codec'
import FFmpegOutputFormat from './output-format'
import FFmpegInputFormat from './input-format'
import FFmpegDictionary from './dictionary'

declare class FFmpegFormatContext {
  readonly io: FFmpegIOContext
  readonly streams: FFmpegStream[]

  constructor(io: FFmpegIOContext)

  readFrame(packet: FFmpegPacket): boolean

  getBestStreamIndex(type: number): number
  getStream(index: number): FFmpegStream
  getBestStream(type: number): FFmpegStream | null

  destroy(): void
  [Symbol.dispose](): void
}

declare class FFmpegInputFormatContext extends FFmpegFormatContext {
  constructor(io: FFmpegIOContext)
  constructor(input: FFmpegInputFormat, option?: FFmpegDictionary, url?: string)

  destroy(): void
}

declare class FFmpegOutputFormatContext extends FFmpegFormatContext {
  constructor(format: FFmpegOutputFormat | string, io: FFmpegIOContext)

  createStream(codec: FFmpegCodec): FFmpegStream

  destroy(): void
}

export {
  FFmpegInputFormatContext as InputFormatContext,
  FFmpegOutputFormatContext as OutputFormatContext
}
