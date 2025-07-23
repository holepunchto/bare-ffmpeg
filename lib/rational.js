module.exports = class FFmpegRational {
  constructor(numerator = 0, denominator = 1) {
    this.numerator = numerator
    this.denominator = denominator
  }

  get valid() {
    // don't support negative denominators unless
    // required by codec or format
    if (this.denominator < 1) return false

    // common initial value for AVRational(0, 1)
    if (this.q2d() === 0) return false

    return true
  }

  get uninitialized() {
    return this.numerator === 0 && this.denominator === 1
  }

  q2d() {
    return this.numerator / this.denominator
  }
}
