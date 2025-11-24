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

// CodecContext.hwDeviceCtx tests

test('CodecContext.hwDeviceCtx should be settable (darwin)', darwinFilter, (t) => {
  using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  using codecContext = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.decoder)

  t.execution(() => {
    codecContext.hwDeviceCtx = hwDevice
  })
})

test('CodecContext.hwDeviceCtx should be gettable after setting (darwin)', darwinFilter, (t) => {
  using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  using codecContext = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.decoder)

  codecContext.hwDeviceCtx = hwDevice

  const retrieved = codecContext.hwDeviceCtx
  t.ok(retrieved)
  t.ok(retrieved instanceof ffmpeg.HWDeviceContext)
})

test('CodecContext.hwDeviceCtx should return null when not set (darwin)', darwinFilter, (t) => {
  using codecContext = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.decoder)

  const hwDeviceCtx = codecContext.hwDeviceCtx
  t.is(hwDeviceCtx, null)
})

test('HWDeviceContext.from should return null for null handle', (t) => {
  const result = ffmpeg.HWDeviceContext.from(null)
  t.is(result, null)
})
