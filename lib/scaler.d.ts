import FFmpegFrame from './frame'

declare class FFmpegScaler {
  constructor(
    sourcePixelFormat: string | number,
    sourceWidth: number,
    sourceHeight: number,
    targetPixelFormat: string | number,
    targetWidth: number,
    targetHeight: number
  )

  scale(
    source: FFmpegFrame,
    y: number,
    height: number,
    target: FFmpegFrame
  ): boolean
  scale(source: FFmpegFrame, y: number, target: FFmpegFrame): boolean
  scale(source: FFmpegFrame, target: FFmpegFrame): boolean

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegScaler
