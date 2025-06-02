const test = require('brittle')
const ffmpeg = require('..')

test('packet should expose a buffer getter', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)

  t.ok(packet.data instanceof Buffer)
  t.ok(packet.data.byteLength > 0)
})

test('packet should expose a streamIndex getter', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)

  t.ok(typeof packet.streamIndex == 'number')
})

test('packet should be instantiate from an Buffer', (t) => {
  const buf = Buffer.from([0x41, 0x42, 0x43, 0x44])
  const packet = new ffmpeg.Packet(buf)
  t.ok(packet)
})

test('packet should copy and expose its data', (t) => {
  const inputBuffer = Buffer.from([0x41, 0x42, 0x43, 0x44])
  const packet = new ffmpeg.Packet(inputBuffer)

  const buffer = packet.data

  t.ok(buffer[0] == 0x41)
  t.ok(buffer[1] == 0x42)
  t.ok(buffer[2] == 0x43)
  t.ok(buffer[3] == 0x44)
})

function fillPacket(packet) {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)
  const format = new ffmpeg.InputFormatContext(io)
  format.readFrame(packet)
}
