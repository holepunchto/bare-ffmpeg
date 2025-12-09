const ffmpeg = require('..')

const fs = require('bare-fs')
const path = require('bare-path')
const process = require('bare-process')

const filename = process.argv[2]
const frameNum = parseInt(process.argv[3], 10)

if (!filename || isNaN(frameNum)) {
  console.error('Usage: bare examples/extract-frame.js <file> <frame_number>')
  process.exit(1)
}

const video = require(path.resolve(filename), {
  with: { type: 'binary' }
})
const io = new ffmpeg.IOContext(video)

using inputFormat = new ffmpeg.InputFormatContext(io)
const stream = inputFormat.getBestStream(ffmpeg.constants.mediaTypes.VIDEO)
const decoder = stream.decoder()
decoder.open()

using packet = new ffmpeg.Packet()
using frame = new ffmpeg.Frame()

let currentFrame = 0
let found = false

console.log(`Searching for frame ${frameNum}...`)

while (inputFormat.readFrame(packet)) {
  if (packet.streamIndex === stream.index) {
    if (decoder.sendPacket(packet)) {
      while (decoder.receiveFrame(frame)) {
        if (currentFrame === frameNum) {
          console.log(`Extracting frame ${frameNum}...`)

          const outFilename = `frame-${frameNum}.jpg`
          const outFd = fs.openSync(outFilename, 'w')

          const outIO = new ffmpeg.IOContext(32 * 1024, {
            onwrite: (buffer) => fs.writeSync(outFd, buffer)
          })

          using outputFormat = new ffmpeg.OutputFormatContext('mjpeg', outIO)
          const outStream = outputFormat.createStream()
          outStream.codecParameters.id = ffmpeg.Codec.MJPEG.id
          outStream.codecParameters.type = ffmpeg.constants.mediaTypes.VIDEO
          outStream.codecParameters.width = frame.width
          outStream.codecParameters.height = frame.height
          outStream.codecParameters.format = ffmpeg.constants.pixelFormats.YUVJ420P
          outStream.timeBase = new ffmpeg.Rational(1, 25)

          const encoder = outStream.encoder()
          encoder.timeBase = outStream.timeBase
          encoder.open()

          outputFormat.writeHeader()

                              using scaler = new ffmpeg.Scaler(

                                frame.format, frame.width, frame.height,

                                ffmpeg.constants.pixelFormats.YUVJ420P, frame.width, frame.height

                              )

                    

                              using convFrame = new ffmpeg.Frame()

                              convFrame.width = frame.width

                              convFrame.height = frame.height

                              convFrame.format = ffmpeg.constants.pixelFormats.YUVJ420P

                              convFrame.alloc()

                    

                              scaler.scale(frame, convFrame)

                              convFrame.pts = 0

                    

                              encoder.sendFrame(convFrame)

          using outPacket = new ffmpeg.Packet()
          while (encoder.receivePacket(outPacket)) {
            outputFormat.writeFrame(outPacket)
          }

          outputFormat.writeTrailer()
          encoder.destroy()
          fs.closeSync(outFd)

          console.log(`Saved to ${outFilename}`)
          found = true
          break
        }
        currentFrame++
      }
    }
  }
  packet.unref()
  if (found) break
}

decoder.destroy()

if (!found) {
  console.error(`Frame ${frameNum} not found (video only has ${currentFrame} frames)`)
  process.exit(1)
}
