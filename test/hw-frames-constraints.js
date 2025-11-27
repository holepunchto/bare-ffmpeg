const test = require('brittle')
const ffmpeg = require('..')
const os = require('bare-os')

const darwinFilter = os.platform() !== 'darwin'

let hwDevice
let hwFrames
let constraints

test.hook('setup', { skip: darwinFilter }, () => {
  hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  hwFrames = new ffmpeg.HWFramesContext(
    hwDevice,
    ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
    ffmpeg.constants.pixelFormats.NV12,
    640,
    480
  )
  constraints = hwFrames.getConstraints()
})

test(
  'HWFramesConstraints should expose validSwFormats getter (darwin)',
  { skip: darwinFilter },
  (t) => {
    t.ok(Array.isArray(constraints.validSwFormats))
    t.ok(constraints.validSwFormats.length > 0)
  }
)

test(
  'HWFramesConstraints should expose validHwFormats getter (darwin)',
  { skip: darwinFilter },
  (t) => {
    t.ok(Array.isArray(constraints.validHwFormats))
    t.ok(constraints.validHwFormats.length > 0)
  }
)

test('HWFramesConstraints should expose minWidth getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(typeof constraints.minWidth, 'number')
  t.ok(constraints.minWidth >= 0)
})

test('HWFramesConstraints should expose maxWidth getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(typeof constraints.maxWidth, 'number')
  t.ok(constraints.maxWidth >= 0)
})

test('HWFramesConstraints should expose minHeight getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(typeof constraints.minHeight, 'number')
  t.ok(constraints.minHeight >= 0)
})

test('HWFramesConstraints should expose maxHeight getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(typeof constraints.maxHeight, 'number')
  t.ok(constraints.maxHeight >= 0)
})

test('HWFramesConstraints should have destroy method (darwin)', { skip: darwinFilter }, (t) => {
  t.ok(typeof constraints.destroy === 'function')
})

test.hook('teardown', { skip: darwinFilter }, () => {
  constraints.destroy()
  hwFrames.destroy()
  hwDevice.destroy()
})
