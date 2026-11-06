const test = require('brittle')
const os = require('bare-os')
const ffmpeg = require('..')

const androidFilter = { skip: os.platform() !== 'android' }

test('MediaCodec decodes H.264 to software frames', androidFilter, (t) => {
  const video = require('./fixtures/video/sample.mp4', {
    with: { type: 'binary' }
  })

  using io = new ffmpeg.IOContext(video)
  using format = new ffmpeg.InputFormatContext(io)

  const stream = format.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)

  using decoder = new ffmpeg.CodecContext(new ffmpeg.Decoder('h264_mediacodec'))
  stream.codecParameters.toContext(decoder)
  decoder.open()

  using packet = new ffmpeg.Packet()
  using frame = new ffmpeg.Frame()

  let decoded = false

  while (!decoded && format.readFrame(packet)) {
    if (packet.streamIndex === stream.index) {
      decoder.sendPacket(packet)
      decoded = decoder.receiveFrame(frame)
    }

    packet.unref()
  }

  if (!decoded) {
    decoder.sendPacket(null)
    decoded = decoder.receiveFrame(frame)
  }

  t.ok(decoded, 'decodes a frame')
  t.ok(frame.width > 0 && frame.height > 0, 'with a size')
  t.not(frame.format, ffmpeg.constants.pixelFormats.MEDIACODEC, 'in software memory')
})

test('MediaCodec device context can be created', androidFilter, (t) => {
  using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.MEDIACODEC)

  t.ok(hwDevice)
})
