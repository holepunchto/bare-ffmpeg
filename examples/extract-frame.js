const ffmpeg = require('..')
const fs = require('bare-fs')
const process = require('bare-process')

function extractRGBA(filename, frameNum) {
  const fd = fs.openSync(filename, 'r')
  const fileSize = fs.fstatSync(fd).size
  let offset = 0

  const io = new ffmpeg.IOContext(4096, {
    onread: (buffer, requested) => {
      // console.log(`onread - requested=${requested}, offset=${offset}, fileSize=${fileSize}`)
      const read = fs.readSync(fd, buffer, 0, requested, offset)
      if (read === 0) return 0
      offset += read
      return read
    },
    onseek: (o, whence) => {
      if (whence === ffmpeg.constants.seek.SIZE) return fileSize
      if (whence === ffmpeg.constants.seek.SET) offset = o
      else if (whence === ffmpeg.constants.seek.CUR) offset += o
      else if (whence === ffmpeg.constants.seek.END) offset = fileSize + o
      else return -1
      return offset
    }
  })

  let result = null
  let decoder = null

  try {
    using inputFormat = new ffmpeg.InputFormatContext(io)
    const stream = inputFormat.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
    decoder = stream.decoder()
    decoder.open()

    using packet = new ffmpeg.Packet()
    using frame = new ffmpeg.Frame()

    let currentFrame = 0

    console.log(`Searching for frame ${frameNum}...`)

    while (inputFormat.readFrame(packet)) {
      if (packet.streamIndex === stream.index) {
        if (decoder.sendPacket(packet)) {
          while (decoder.receiveFrame(frame)) {
            if (currentFrame === frameNum) {
              console.log(`Extracting frame ${frameNum}...`)

              using scaler = new ffmpeg.Scaler(
                frame.format,
                frame.width,
                frame.height,
                ffmpeg.constants.pixelFormats.RGBA,
                frame.width,
                frame.height
              )

              using rgbaFrame = new ffmpeg.Frame()
              rgbaFrame.width = frame.width
              rgbaFrame.height = frame.height
              rgbaFrame.format = ffmpeg.constants.pixelFormats.RGBA
              rgbaFrame.alloc()

              scaler.scale(frame, rgbaFrame)

              const image = new ffmpeg.Image(
                ffmpeg.constants.pixelFormats.RGBA,
                rgbaFrame.width,
                rgbaFrame.height
              )
              image.read(rgbaFrame)

              result = {
                width: rgbaFrame.width,
                height: rgbaFrame.height,
                data: image.data
              }
              break
            }
            currentFrame++
          }
        }
      }
      packet.unref()
      if (result) break
    }
  } finally {
    if (decoder) decoder.destroy()
    fs.closeSync(fd)
  }

  if (!result) {
    throw new Error(`Frame ${frameNum} not found`)
  }

  return result
}

function exportPreviewImage(rgbaData, outFilename) {
  const outFd = fs.openSync(outFilename, 'w')

  const outIO = new ffmpeg.IOContext(32 * 1024, {
    onwrite: (buffer) => fs.writeSync(outFd, buffer)
  })

  using outputFormat = new ffmpeg.OutputFormatContext('mjpeg', outIO)
  const outStream = outputFormat.createStream()
  outStream.codecParameters.id = ffmpeg.Codec.MJPEG.id
  outStream.codecParameters.type = ffmpeg.constants.mediaTypes.VIDEO
  outStream.codecParameters.width = rgbaData.width
  outStream.codecParameters.height = rgbaData.height
  outStream.codecParameters.format = ffmpeg.constants.pixelFormats.YUVJ420P
  outStream.timeBase = new ffmpeg.Rational(1, 25)

  const encoder = outStream.encoder()
  encoder.timeBase = outStream.timeBase
  encoder.open()

  outStream.codecParameters.fromContext(encoder)

  outputFormat.writeHeader()

  // Convert RGBA -> YUVJ420P for JPEG
  using scaler = new ffmpeg.Scaler(
    ffmpeg.constants.pixelFormats.RGBA,
    rgbaData.width,
    rgbaData.height,
    ffmpeg.constants.pixelFormats.YUVJ420P,
    rgbaData.width,
    rgbaData.height
  )

  using inputFrame = new ffmpeg.Frame()
  inputFrame.width = rgbaData.width
  inputFrame.height = rgbaData.height
  inputFrame.format = ffmpeg.constants.pixelFormats.RGBA
  inputFrame.alloc()

  // Fill input frame with our RGBA data
  const image = new ffmpeg.Image(
    ffmpeg.constants.pixelFormats.RGBA,
    rgbaData.width,
    rgbaData.height
  )
  rgbaData.data.copy(image.data)
  image.fill(inputFrame)

  using outputFrame = new ffmpeg.Frame()
  outputFrame.width = rgbaData.width
  outputFrame.height = rgbaData.height
  outputFrame.format = ffmpeg.constants.pixelFormats.YUVJ420P
  outputFrame.alloc()

  scaler.scale(inputFrame, outputFrame)
  outputFrame.pts = 0

  encoder.sendFrame(outputFrame)

  using outPacket = new ffmpeg.Packet()
  while (encoder.receivePacket(outPacket)) {
    outputFormat.writeFrame(outPacket)
  }

  outputFormat.writeTrailer()
  encoder.destroy()
  fs.closeSync(outFd)
  console.log(`Saved to ${outFilename}`)
}

// Main execution
try {
  const filename = process.argv[2]
  const frameNum = parseInt(process.argv[3], 10)

  if (!filename || isNaN(frameNum)) {
    console.error('Usage: bare examples/extract-frame.js <file> <frame_number>')
    process.exit(1)
  }

  const rgbaData = extractRGBA(filename, frameNum)
  exportPreviewImage(rgbaData, `frame-${frameNum}.jpg`)
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
