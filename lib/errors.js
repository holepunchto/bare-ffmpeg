module.exports = class FFmpegError extends Error {
  constructor(msg, code, fn = FFmpegError) {
    super(`${code}: ${msg}`)
    this.code = code

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, fn)
    }
  }

  get name() {
    return 'FFmpegError'
  }

  static UNKNOWN_PIXEL_FORMAT(msg) {
    return new FFmpegError(
      msg,
      'UNKNOWN_PIXEL_FORMAT',
      FFmpegError.UNKNOWN_PIXEL_FORMAT
    )
  }

  static UNKNOWN_SAMPLE_FORMAT(msg) {
    return new FFmpegError(
      msg,
      'UNKNOWN_SAMPLE_FORMAT',
      FFmpegError.UNKNOWN_SAMPLE_FORMAT
    )
  }

  static UNKNOWN_CHANNEL_LAYOUT(msg) {
    return new FFmpegError(
      msg,
      'UNKNOWN_CHANNEL_LAYOUT',
      FFmpegError.UNKNOWN_CHANNEL_LAYOUT
    )
  }
}
