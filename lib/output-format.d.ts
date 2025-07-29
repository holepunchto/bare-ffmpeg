declare class FFmpegOutputFormat {
  readonly name: string
  readonly longName: string
  readonly flags: number

  constructor(name: string)
}

export = FFmpegOutputFormat
