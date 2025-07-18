declare class FFmpegChannelLayout {
  readonly nbChannels: number

  constructor(handle: ArrayBuffer)

  static from(value: FFmpegChannelLayout | string | number): FFmpegChannelLayout
}

export = FFmpegChannelLayout
