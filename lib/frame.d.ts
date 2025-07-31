import FFmpegChannelLayout from './channel-layout'
import FFmpegRational from './rational'

declare class FFmpegFrame {
  readonly pictType: number

  get channelLayout(): FFmpegChannelLayout
  set channelLayout(value: FFmpegChannelLayout | string | number)

  width: number
  height: number
  pixelFormat: number
  format: number
  nbSamples: number
  pts: number
  packetDTS: number
  timeBase: FFmpegRational

  constructor()

  alloc(): void
  unref(): void

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegFrame
