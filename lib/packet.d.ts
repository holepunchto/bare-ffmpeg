import Buffer from 'bare-buffer'

declare class FFmpegPacket {
  readonly streamIndex: number
  readonly data: Buffer
  readonly isKeyframe: boolean

  constructor(buffer?: Buffer)

  unref(): void

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegPacket
