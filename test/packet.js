const test = require('brittle')
const ffmpeg = require('..')

test('packet should expose a buffer getter', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)

  t.ok(packet.buffer instanceof Buffer)
  t.ok(packet.buffer.byteLength > 0)
})

test('packet should expose a streamIndex getter', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)

  t.ok(typeof packet.streamIndex == 'number')
})

test('packet should be instantiate from an ArrayBuffer', (t) => {
  const buf = new ArrayBuffer()
  const packet = new ffmpeg.Packet(buf)
  t.ok(packet)
})

test('packet should copy and expose its data', (t) => {
  const buf = new ArrayBuffer(4)
  const view = new Uint8Array(buf)
  view.set([0x41, 0x42, 0x43, 0x44])

  const packet = new ffmpeg.Packet(buf)
  const buffer = packet.buffer

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
