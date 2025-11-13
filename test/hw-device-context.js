const os = require('bare-os')
const test = require('brittle')
const ffmpeg = require('..')

if (os.platform() === 'darwin') {
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

  test('HWDeviceContext should work without device parameter (real-world VideoToolbox usage)', (t) => {
    t.execution(() => {
      // VideoToolbox on macOS doesn't require a device string (uses available hardware automatically)
      const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX, null)
      hwDevice.destroy()
    })
  })
}
