declare class FFmpegInputFormat {
  readonly name: string
  readonly longName: string
  readonly flags: number

  constructor(name?: string, handle?: ArrayBuffer)
}

export = FFmpegInputFormat
