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
