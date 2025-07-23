import Buffer from 'bare-buffer'
import FFmpegFrame from './frame'

declare class FFmpegSamples {
  readonly sampleFormat: string | number
  readonly nbChannels: number
  readonly nbSamples: number
  readonly align: number
  readonly data: Buffer

  constructor(sampleFormat: string | number, nbSamples: number, align?: number)

  fill(frame: FFmpegFrame): void
}

export = FFmpegSamples
