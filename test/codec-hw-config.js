const test = require('brittle')
const ffmpeg = require('..')

test.skip('CodecHWConfig should expose a methods getter', (t) => {
  const hwConfig = ffmpeg.Codec.MJPEG.decoder.getHardwareConfigAt(0)

  t.is(typeof hwConfig.methods, 'number')
})
