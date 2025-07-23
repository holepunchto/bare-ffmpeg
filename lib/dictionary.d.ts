declare class FFmpegDictionary {
  constructor()

  get(key: string): string
  set(key: string, value: string): void

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegDictionary
