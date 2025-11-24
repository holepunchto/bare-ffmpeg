const os = require('bare-os')
const test = require('brittle')
const ffmpeg = require('..')
const process = require('bare-process')

// Darwin

const darwinFilter = { skip: os.platform() !== 'darwin' }

test('HWDeviceContext should instantiate with device type (darwin)', darwinFilter, (t) => {
  using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  t.ok(hwDevice)
})

test('HWDeviceContext should expose a destroy method (darwin)', darwinFilter, (t) => {
  const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)

  t.execution(() => {
    hwDevice.destroy()
  })
})

// Linux

const linuxFilter = { skip: process.env.CI || os.platform() !== 'linux' }

test('HWDeviceContext should instantiate with device type (linux)', linuxFilter, (t) => {
  using hwDevice = new ffmpeg.HWDeviceContext(
    ffmpeg.constants.hwDeviceTypes.VAAPI,
    '/dev/dri/renderD128'
  )
  t.ok(hwDevice)
})

test('HWDeviceContext should expose a destroy method (linux)', linuxFilter, (t) => {
  const hwDevice = new ffmpeg.HWDeviceContext(
    ffmpeg.constants.hwDeviceTypes.VAAPI,
    '/dev/dri/renderD128'
  )

  t.execution(() => {
    hwDevice.destroy()
  })
})
