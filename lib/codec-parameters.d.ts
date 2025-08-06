import FFmpegChannelLayout from './channel-layout'
import FFmpegCodecContext from './codec-context'

declare class FFmpegCodecParameters {
  readonly bitRate: number
  readonly bitsPerCodedSample: number
  readonly bitsPerRawSample: number
  readonly format: number
  readonly sampleRate: number
  readonly nbChannels: number
  readonly codecType: number
  readonly codecTag: number
  readonly codecId: number
  readonly channelLayout: FFmpegChannelLayout
  extraData: Buffer

  constructor(handle: ArrayBuffer)

  fromContext(context: FFmpegCodecContext): void
  toContext(context: FFmpegCodecContext): void
}

export = FFmpegCodecParameters
