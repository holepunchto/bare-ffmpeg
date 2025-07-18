import Buffer from 'bare-buffer'

declare class FFmpegIOContext {
  constructor(buffer?: Buffer)

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegIOContext
