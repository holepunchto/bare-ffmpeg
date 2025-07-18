import Buffer from 'bare-buffer'
import FFmpegFrame from './frame'

declare class FFmpegImage {
  readonly pixelFormat: number
  readonly width: number
  readonly height: number
  readonly align: number
  readonly data: Buffer

  constructor(
    pixelFormat: string | number,
    width: number,
    height: number,
    align?: number
  )

  fill(frame: FFmpegFrame): void
  read(frame: FFmpegFrame): void

  lineSize(plane?: number): number

  static lineSize(
    pixelFormat: string | number,
    width: number,
    plane?: number
  ): number
}

export = FFmpegImage
