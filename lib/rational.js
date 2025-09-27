const binding = require('../binding')
const { AV_ROUND_NEAR_INF } = require('./constants').rounding

module.exports = class FFmpegRational {
  constructor(numerator = 0, denominator = 1) {
    this.numerator = numerator
    this.denominator = denominator
  }

  get valid() {
    // don't support negative denominators for now
    if (this.denominator < 0) return false

    const n = this.toNumber()

    if (Number.isNaN(n) || n === 0) return false

    return true
  }

  get uninitialized() {
    // common initial value for AVRational(0, 1)
    return this.numerator === 0 && this.denominator === 1
  }

  toNumber() {
    return this.numerator / this.denominator
  }

  equals(other) {
    return (
      this.numerator === other.numerator &&
      this.denominator === other.denominator
    )
  }

  static from(num) {
    const view = new Int32Array(binding.rationalD2Q(num))
    return new FFmpegRational(view[0], view[1])
  }

  static rescaleQ(n, src, dst, round = AV_ROUND_NEAR_INF) {
    if (src.equals(dst)) return n

    return binding.rationalRescaleQ(
      n,
      src.numerator,
      src.denominator,
      dst.numerator,
      dst.denominator,
      round
    )
  }
}
