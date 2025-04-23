const test = require('brittle')
const ffmpeg = require('..')

test('packet should expose a buffer getter', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)

  t.ok(packet.buffer instanceof ArrayBuffer)
  t.ok(packet.buffer.byteLength > 0)
})

function fillPacket(packet) {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)
  const format = new ffmpeg.InputFormatContext(io)
  format.readFrame(packet)
}
