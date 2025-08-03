declare class FFmpegRational {
  numerator: number
  denominator: number
  valid: boolean
  unintialized: boolean

  constructor(numerator: number, denominator: number)

  toNumber(): number
  static from(number: number): Rational
  static rescaleQ(n: Number, a: Rational, b: Rational)
}

export = FFmpegRational
