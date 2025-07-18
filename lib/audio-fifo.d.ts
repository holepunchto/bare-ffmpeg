import FFmpegFrame from './frame'

declare class FFmpegAudioFIFO {
  readonly size: number
  readonly space: number

  constructor(sampleFormat: number, channels: number, nbSamples: number)

  write(frame: FFmpegFrame): number
  read(frame: FFmpegFrame, nbSamples: number): number
  peek(frame: FFmpegFrame, nbSamples: number): number
  drain(nbSamples: number): number

  reset(): void

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegAudioFIFO
