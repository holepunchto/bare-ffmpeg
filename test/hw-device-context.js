const os = require('bare-os')
const test = require('brittle')
const ffmpeg = require('..')
const process = require('bare-process')

if (os.platform() === 'darwin') {
  test('HWDeviceContext should instantiate with device type', (t) => {
    using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
    t.ok(hwDevice)
  })

  test('HWDeviceContext should expose a destroy method', (t) => {
    const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)

    t.execution(() => {
      hwDevice.destroy()
    })
  })
}

if (os.platform() === 'linux') {
  if (process.env.CI) {
    return
  }

  test('HWDeviceContext should instantiate with device type', (t) => {
    using hwDevice = new ffmpeg.HWDeviceContext(
      ffmpeg.constants.hwDeviceTypes.VAAPI,
      '/dev/dri/renderD128'
    )
    t.ok(hwDevice)
  })

  test('HWDeviceContext should expose a destroy method', (t) => {
    const hwDevice = new ffmpeg.HWDeviceContext(
      ffmpeg.constants.hwDeviceTypes.VAAPI,
      '/dev/dri/renderD128'
    )

    t.execution(() => {
      hwDevice.destroy()
    })
  })
}
