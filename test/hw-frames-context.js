const test = require('brittle')
const ffmpeg = require('..')
const os = require('bare-os')

const darwinFilter = os.platform() !== 'darwin'

test('HWFramesContext.from should return null for null handle', (t) => {
  const ctx = ffmpeg.HWFramesContext.from(null)
  t.is(ctx, null)
})

test(
  'HWFramesContext should instantiate with all parameters (darwin)',
  { skip: darwinFilter },
  (t) => {
    using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
    using hwFrames = new ffmpeg.HWFramesContext(
      hwDevice,
      ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
      ffmpeg.constants.pixelFormats.NV12,
      640,
      480
    )
    t.ok(hwFrames)
  }
)

test('HWFramesContext should expose format getter (darwin)', { skip: darwinFilter }, (t) => {
  using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  using hwFrames = new ffmpeg.HWFramesContext(
    hwDevice,
    ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
    ffmpeg.constants.pixelFormats.NV12,
    640,
    480
  )

  t.is(hwFrames.format, ffmpeg.constants.pixelFormats.VIDEOTOOLBOX)
})

test('HWFramesContext should expose swFormat getter (darwin)', { skip: darwinFilter }, (t) => {
  using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  using hwFrames = new ffmpeg.HWFramesContext(
    hwDevice,
    ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
    ffmpeg.constants.pixelFormats.NV12,
    640,
    480
  )

  t.is(hwFrames.swFormat, ffmpeg.constants.pixelFormats.NV12)
})

test('HWFramesContext should expose width getter (darwin)', { skip: darwinFilter }, (t) => {
  using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  using hwFrames = new ffmpeg.HWFramesContext(
    hwDevice,
    ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
    ffmpeg.constants.pixelFormats.NV12,
    640,
    480
  )

  t.is(hwFrames.width, 640)
})

test('HWFramesContext should expose height getter (darwin)', { skip: darwinFilter }, (t) => {
  using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
  using hwFrames = new ffmpeg.HWFramesContext(
    hwDevice,
    ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
    ffmpeg.constants.pixelFormats.NV12,
    640,
    480
  )

  t.is(hwFrames.height, 480)
})

test(
  'HWFramesContext.getBuffer should allocate hardware frame (darwin)',
  { skip: darwinFilter || require('bare-process').env.CI },
  (t) => {
    using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
    using hwFrames = new ffmpeg.HWFramesContext(
      hwDevice,
      ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
      ffmpeg.constants.pixelFormats.NV12,
      640,
      480
    )

    using frame = new ffmpeg.Frame()
    hwFrames.getBuffer(frame)

    t.is(frame.width, 640)
    t.is(frame.height, 480)
    t.is(frame.format, ffmpeg.constants.pixelFormats.VIDEOTOOLBOX)
    t.ok(frame.hwFramesCtx instanceof ffmpeg.HWFramesContext)
  }
)
