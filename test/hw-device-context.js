const test = require('brittle')
const ffmpeg = require('..')

test('HWDeviceContext should instantiate with device type', (t) => {
  const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  t.ok(hwDevice)
})

test('HWDeviceContext should expose a destroy method', (t) => {
  const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)

  t.execution(() => {
    hwDevice.destroy()
  })
})

test('HWDeviceContext should work with using declaration', (t) => {
  t.execution(() => {
    using _hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  })
})
