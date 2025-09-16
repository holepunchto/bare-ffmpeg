const test = require('brittle')
const ffmpeg = require('..')
const { SideData } = require('../lib/packet')

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

test('packet should expose isKeyFrame getter', (t) => {
  const packet = new ffmpeg.Packet()

  t.is(typeof packet.isKeyframe, 'boolean')
})

test('packet should expose isKeyFrame setter', (t) => {
  const packet = new ffmpeg.Packet()

  packet.isKeyframe = false
  t.is(packet.isKeyframe, false)

  packet.isKeyframe = true
  t.is(packet.isKeyframe, true)
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

test('packet should expose a sideData getter', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)

  const sideData = packet.sideData
  t.ok(Array.isArray(sideData))
})

test('packet should expose a sideData setter', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)

  // TODO: there is crash if I pass two SideData with the same type
  // See how we could handle it.
  packet.sideData = [
    ffmpeg.Packet.SideData.fromData(
      Buffer.from('lol'),
      ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
    ),
    ffmpeg.Packet.SideData.fromData(
      Buffer.from('lol'),
      ffmpeg.constants.packetSideDataType.H263_MB_INFO
    )
  ]

  const sideData = packet.sideData
  t.ok(Array.isArray(sideData))
  t.is(sideData.length, 2)
})

test('sideData object should expose a type method', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)
  const obj1 = ffmpeg.Packet.SideData.fromData(
    Buffer.from('lol'),
    ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
  )
  packet.sideData = [obj1]

  const sideDataObject = packet.sideData.at(0)

  t.is(sideDataObject.type, ffmpeg.constants.packetSideDataType.NEW_EXTRADATA)
})

test('sideData object should expose a name method', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)
  const obj1 = ffmpeg.Packet.SideData.fromData(
    Buffer.from('lol'),
    ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
  )
  packet.sideData = [obj1]

  const sideDataObject = packet.sideData.at(0)

  t.is(sideDataObject.name, 'New Extradata')
})

test('sideData object should expose a data method', (t) => {
  const packet = new ffmpeg.Packet()
  fillPacket(packet)
  const buf = Buffer.from('lol')
  const obj1 = ffmpeg.Packet.SideData.fromData(
    buf,
    ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
  )
  packet.sideData = [obj1]

  const sideDataObject = packet.sideData.at(0)
  t.alike(sideDataObject.data, buf)
})

function fillPacket(packet) {
  const image = require('./fixtures/image/sample.jpeg', {
    with: { type: 'binary' }
  })
  const io = new ffmpeg.IOContext(image)
  const format = new ffmpeg.InputFormatContext(io)
  format.readFrame(packet)
}

test('packet copyPropsFrom should copy all properties', (t) => {
  const sourcePacket = new ffmpeg.Packet()
  sourcePacket.streamIndex = 5
  sourcePacket.dts = 1000
  sourcePacket.pts = 1000
  sourcePacket.duration = 40
  sourcePacket.flags = 1
  sourcePacket.timeBase = new ffmpeg.Rational(1, 48000)
  sourcePacket.isKeyframe = true
  sourcePacket.sideData = [
    ffmpeg.Packet.SideData.fromData(
      Buffer.from('extra'),
      ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
    )
  ]

  const destPacket = new ffmpeg.Packet()
  destPacket.copyPropsFrom(sourcePacket)

  t.is(destPacket.streamIndex, 5)
  t.is(destPacket.dts, 1000)
  t.is(destPacket.pts, 1000)
  t.is(destPacket.duration, 40)
  t.is(destPacket.flags, 1)
  t.alike(destPacket.timeBase, new ffmpeg.Rational(1, 48000))
  t.is(destPacket.isKeyframe, true)

  const sideData = destPacket.sideData
  t.is(sideData.length, 1)
  t.is(sideData[0].type, ffmpeg.constants.packetSideDataType.NEW_EXTRADATA)
})

test('packet getSideDataByType should return specific side data', (t) => {
  const packet = new ffmpeg.Packet()

  packet.sideData = [
    ffmpeg.Packet.SideData.fromData(
      Buffer.from('extradata'),
      ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
    ),
    ffmpeg.Packet.SideData.fromData(
      Buffer.from('h263info'),
      ffmpeg.constants.packetSideDataType.H263_MB_INFO
    )
  ]

  const extraData = packet.getSideDataByType(
    ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
  )
  t.ok(extraData instanceof Buffer)
  t.alike(extraData, Buffer.from('extradata'))

  const h263Data = packet.getSideDataByType(
    ffmpeg.constants.packetSideDataType.H263_MB_INFO
  )
  t.ok(h263Data instanceof Buffer)
  t.alike(h263Data, Buffer.from('h263info'))

  const missing = packet.getSideDataByType(
    ffmpeg.constants.packetSideDataType.PARAM_CHANGE
  )
  t.is(missing, null)
})

test('packet addSideData should add side data by type', (t) => {
  const packet = new ffmpeg.Packet()

  const data1 = Buffer.from('test data 1')
  packet.addSideData(ffmpeg.constants.packetSideDataType.NEW_EXTRADATA, data1)

  const retrieved = packet.getSideDataByType(
    ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
  )
  t.ok(retrieved instanceof Buffer)
  t.alike(retrieved, data1)

  const data2 = Buffer.from('test data 2')
  packet.addSideData(ffmpeg.constants.packetSideDataType.PARAM_CHANGE, data2)

  const sideData = packet.sideData
  t.is(sideData.length, 2)
})

test('packet inspect should show side data info', (t) => {
  const packet = new ffmpeg.Packet()
  packet.data = Buffer.from('sample data')
  packet.streamIndex = 1
  packet.dts = 500
  packet.pts = 500
  packet.sideData = [
    ffmpeg.Packet.SideData.fromData(
      Buffer.from('extradata'),
      ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
    ),
    ffmpeg.Packet.SideData.fromData(
      Buffer.from('params'),
      ffmpeg.constants.packetSideDataType.PARAM_CHANGE
    )
  ]

  const inspected = packet[Symbol.for('bare.inspect')]()

  t.is(inspected.streamIndex, 1)
  t.is(inspected.dts, 500)
  t.is(inspected.pts, 500)
  t.is(inspected.dataSize, 11)

  t.ok(Array.isArray(inspected.sideData))
  t.is(inspected.sideData.length, 2)
  t.is(
    inspected.sideData[0].type,
    ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
  )
  t.is(inspected.sideData[0].size, 9)
  t.is(
    inspected.sideData[1].type,
    ffmpeg.constants.packetSideDataType.PARAM_CHANGE
  )

  t.is(inspected.hasNewExtradata, true)
  t.is(inspected.hasParamChange, true)
})

test('packet inspect without codec changes', (t) => {
  const packet = new ffmpeg.Packet()
  packet.data = Buffer.from('data')

  packet.sideData = [
    ffmpeg.Packet.SideData.fromData(
      Buffer.from('other'),
      ffmpeg.constants.packetSideDataType.H263_MB_INFO
    )
  ]

  const inspected = packet[Symbol.for('bare.inspect')]()

  t.is(inspected.hasNewExtradata, undefined)
  t.is(inspected.hasParamChange, undefined)
})

test('SideData inspect should show size not full data', (t) => {
  const largeBuffer = Buffer.alloc(1024)
  const sideData = ffmpeg.Packet.SideData.fromData(
    largeBuffer,
    ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
  )

  const inspected = sideData[Symbol.for('bare.inspect')]()

  t.is(inspected.type, ffmpeg.constants.packetSideDataType.NEW_EXTRADATA)
  t.is(inspected.data.length, 1024)
})
