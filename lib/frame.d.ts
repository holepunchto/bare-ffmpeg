import FFmpegChannelLayout from './channel-layout'

declare class FFmpegFrame {
  readonly pictType: number

  get channelLayout(): FFmpegChannelLayout
  set channelLayout(value: FFmpegChannelLayout | string | number)

  width: number
  height: number
  pixelFormat: number
  format: number
  nbSamples: number

  constructor()

  alloc(): void

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegFrame
