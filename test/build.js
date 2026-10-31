module.exports = function build({ device }) {
  const options = { identifier: 'to.holepunch.bare.ffmpeg.test' }

  if (device.platform !== 'ios') return options

  let signing = {}

  try {
    signing = require('./signing.json')
  } catch {}

  return { ...options, sign: 'provisioningProfile' in signing, ...signing }
}
