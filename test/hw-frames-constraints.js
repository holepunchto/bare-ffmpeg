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
})

test('HWFramesConstraints should expose maxWidth getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(typeof constraints.maxWidth, 'number')
})

test('HWFramesConstraints should expose minHeight getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(typeof constraints.minHeight, 'number')
})

test('HWFramesConstraints should expose maxHeight getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(typeof constraints.maxHeight, 'number')
})

test(
  'HWFramesConstraints width constraints should be sensible (darwin)',
  { skip: darwinFilter },
  (t) => {
    t.ok(constraints.minWidth >= 0)
    t.ok(constraints.maxWidth >= constraints.minWidth)
  }
)

test(
  'HWFramesConstraints height constraints should be sensible (darwin)',
  { skip: darwinFilter },
  (t) => {
    t.ok(constraints.minHeight >= 0)
    t.ok(constraints.maxHeight >= constraints.minHeight)
  }
)

test('HWFramesConstraints should have destroy method (darwin)', { skip: darwinFilter }, (t) => {
  t.ok(typeof constraints.destroy === 'function')
})

test.hook('teardown', { skip: darwinFilter }, () => {
  constraints.destroy()
  hwFrames.destroy()
  hwDevice.destroy()
})
