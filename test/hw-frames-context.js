const test = require('brittle')
const ffmpeg = require('..')
const os = require('bare-os')

const darwinFilter = os.platform() !== 'darwin'

let hwDevice
let hwFrames

test('HWFramesContext.from should return null for null handle', (t) => {
  const ctx = ffmpeg.HWFramesContext.from(null)
  t.is(ctx, null)
})

test.hook('setup', { skip: darwinFilter }, () => {
  hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  hwFrames = new ffmpeg.HWFramesContext(
    hwDevice,
    ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
    ffmpeg.constants.pixelFormats.NV12,
    640,
    480
  )
})

test(
  'HWFramesContext should instantiate with all parameters (darwin)',
  { skip: darwinFilter },
  (t) => {
    t.ok(hwFrames)
  }
)

test('HWFramesContext should expose format getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(hwFrames.format, ffmpeg.constants.pixelFormats.VIDEOTOOLBOX)
})

test('HWFramesContext should expose swFormat getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(hwFrames.swFormat, ffmpeg.constants.pixelFormats.NV12)
})

test('HWFramesContext should expose width getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(hwFrames.width, 640)
})

test('HWFramesContext should expose height getter (darwin)', { skip: darwinFilter }, (t) => {
  t.is(hwFrames.height, 480)
})

test(
  'HWFramesContext.getBuffer should allocate hardware frame (darwin)',
  { skip: darwinFilter || require('bare-process').env.CI },
  (t) => {
    using frame = new ffmpeg.Frame()
    hwFrames.getBuffer(frame)

    t.is(frame.width, 640)
    t.is(frame.height, 480)
    t.is(frame.format, ffmpeg.constants.pixelFormats.VIDEOTOOLBOX)
    t.ok(frame.hwFramesCtx instanceof ffmpeg.HWFramesContext)
  }
)

test(
  'HWFramesContext should expose initialPoolSize getter (darwin)',
  { skip: darwinFilter },
  (t) => {
    t.is(typeof hwFrames.initialPoolSize, 'number')
  }
)

test(
  'HWFramesContext should expose initialPoolSize setter (darwin)',
  { skip: darwinFilter },
  (t) => {
    hwFrames.initialPoolSize = 10
    t.is(hwFrames.initialPoolSize, 10)
  }
)

test(
  'HWFramesContext.getConstraints should return HWFramesConstraints instance (darwin)',
  { skip: darwinFilter },
  (t) => {
    using constraints = hwFrames.getConstraints()

    t.ok(constraints instanceof ffmpeg.HWFramesConstraints)
  }
)

test.hook('teardown', { skip: darwinFilter }, () => {
  hwFrames.destroy()
  hwDevice.destroy()
})
