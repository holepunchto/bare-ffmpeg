const test = require('brittle')
const ffmpeg = require('..')

test('packet should expose a buffer getter', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)

  t.ok(packet.data instanceof Buffer)
  t.ok(packet.data.byteLength > 0)
})

test('packet should expose a streamIndex accessor', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)

  t.ok(typeof packet.streamIndex == 'number')

  packet.streamIndex = 9

  t.is(packet.streamIndex, 9)
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

test('packet set data', (t) => {
  const inputBuffer = Buffer.from([0x41, 0x42, 0x43, 0x44])
  const packet = new ffmpeg.Packet(inputBuffer)

  packet.data = Buffer.from([0x45, 0x46, 0x47, 0x48])

  const buffer = packet.data

  t.ok(buffer[0] == 0x45)
  t.ok(buffer[1] == 0x46)
  t.ok(buffer[2] == 0x47)
  t.ok(buffer[3] == 0x48)
})

test('packet should expose dts acessor', (t) => {
  const packet = new ffmpeg.Packet()

  t.is(packet.dts, -1)

  packet.dts = 0

  t.is(packet.dts, 0)
})

test('packet should expose pts acessor', (t) => {
  const packet = new ffmpeg.Packet()

  t.is(packet.pts, -1)

  packet.pts = 0

  t.is(packet.pts, 0)
})

test('packet should expose timeBase accessor', (t) => {
  const packet = new ffmpeg.Packet()

  t.alike(packet.timeBase, new ffmpeg.Rational(0, 1))

  const base = new ffmpeg.Rational(1, 1000)
  packet.timeBase = base

  t.alike(packet.timeBase, base)
})

test('packet should expose duration accessor', (t) => {
  const packet = new ffmpeg.Packet()

  t.is(packet.duration, 0)

  packet.duration = 16

  t.is(packet.duration, 16)
})

test('packet should expose flags accessor', (t) => {
  const packet = new ffmpeg.Packet()

  t.is(packet.flags, 0)

  packet.flags = 1

  t.is(packet.flags, 1)
})

test('rescale packet timestamps & timebase', (t) => {
  const packet = new ffmpeg.Packet()

  const ts = 7000

  packet.dts = ts
  packet.pts = ts
  packet.timeBase = new ffmpeg.Rational(1, 1000)

  const dst = new ffmpeg.Rational(1, 100)

  const success = packet.rescaleTimestamps(dst)
  t.ok(success)

  t.is(packet.dts, packet.pts)
  t.is(packet.dts, 700)
  t.alike(packet.timeBase, dst)
})

function fillPacket(packet) {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)
  const format = new ffmpeg.InputFormatContext(io)
  format.readFrame(packet)
}
