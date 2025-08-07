import FFmpegChannelLayout from './channel-layout'
import FFmpegCodecContext from './codec-context'

declare class FFmpegCodecParameters {
  readonly bitRate: number
  readonly bitsPerCodedSample: number
  readonly bitsPerRawSample: number
  readonly format: number
  readonly sampleRate: number
  readonly nbChannels: number
  codecType: number
  codecTag: number
  codecId: number
  codecProfile: number
  codecLevel: number
  codecFormat: number
  readonly channelLayout: FFmpegChannelLayout
  extraData: Buffer

  constructor(handle: ArrayBuffer)

  fromContext(context: FFmpegCodecContext): void
  toContext(context: FFmpegCodecContext): void
}

export = FFmpegCodecParameters
