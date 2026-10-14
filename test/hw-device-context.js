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

test('HWDeviceContext.from should return null for null handle', (t) => {
  const result = ffmpeg.HWDeviceContext.from(null)
  t.is(result, null)
})

const windowsFilter = {
  skip: process.env.CI || os.platform() !== 'win32'
}

test('decode H.264 video with Vulkan', windowsFilter, (t) => {
  const video = require('./fixtures/video/sample.mp4', {
    with: { type: 'binary' }
  })

  using io = new ffmpeg.IOContext(video)
  using format = new ffmpeg.InputFormatContext(io)
  using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VULKAN)

  const stream = format.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)

  using decoder = stream.decoder()

  decoder.hwDeviceCtx = hwDevice

  decoder.getFormat = (context, pixelFormats) => {
    t.ok(
      pixelFormats.includes(ffmpeg.constants.pixelFormats.VULKAN),
      'decoder offers Vulkan pixel format'
    )

    return ffmpeg.constants.pixelFormats.VULKAN
  }

  decoder.open()

  using packet = new ffmpeg.Packet()
  using frame = new ffmpeg.Frame()

  let decoded = false

  while (format.readFrame(packet)) {
    if (packet.streamIndex !== stream.index) {
      packet.unref()
      continue
    }

    decoder.sendPacket(packet)
    packet.unref()

    while (decoder.receiveFrame(frame)) {
      decoded = true

      t.is(
        frame.format,
        ffmpeg.constants.pixelFormats.VULKAN,
        'decoded frame uses Vulkan pixel format'
      )

      t.ok(
        frame.hwFramesCtx instanceof ffmpeg.HWFramesContext,
        'decoded frame has a Vulkan HWFramesContext'
      )

      t.ok(frame.width > 0, 'decoded frame has width')
      t.ok(frame.height > 0, 'decoded frame has height')

      break
    }

    if (decoded) break
  }

  t.ok(decoded, 'decoded at least one Vulkan frame')
})
