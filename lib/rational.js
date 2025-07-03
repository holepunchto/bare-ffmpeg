module.exports = class FFmpegRational {
  constructor(numerator, denominator) {
    this.numerator = numerator
    this.denominator = denominator
  }

  /**
   * JS approximation of av_rescale_q().
   *
   * @param {number} timestamp
   * @param {FFmpegRational} other
   */
  rescale_q(timestamp, other) {
    return Math.round(
      timestamp * (
        (this.numerator / this.denominator) /
        (other.numerator / other.denominator)
      )
    )
  }
}
