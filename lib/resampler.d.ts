import FFmpegChannelLayout from './channel-layout'
import FFmpegFrame from './frame'

declare class FFmpegResampler {
  readonly inputSampleRate: number
  readonly outputSampleRate: number
  readonly delay: number

  constructor(
    inputSampleRate: number,
    inputChannelLayout: FFmpegChannelLayout | string | number,
    inputFormat: number,
    outputSampleRate: number,
    outputChannelLayout: FFmpegChannelLayout | string | number,
    outputFormat: number
  )

  convert(inputFrame: FFmpegFrame, outputFrame: FFmpegFrame): number

  flush(outputFrame: FFmpegFrame): number

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegResampler
