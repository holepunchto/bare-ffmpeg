const ffmpeg = require('.')

console.log('Minimal VP9 Test')
console.log('================\n')

const width = 160
const height = 120
const frameRate = 30

console.log('Step 1: Creating encoder...')
const encoder = new ffmpeg.Encoder('libvpx-vp9')
console.log('✓ Encoder created')

console.log('Step 2: Creating codec context...')
const context = new ffmpeg.CodecContext(encoder)
console.log('✓ Context created')

console.log('Step 3: Configuring context...')
context.width = width
context.height = height
context.pixelFormat = ffmpeg.constants.pixelFormats.YUV420P
context.timeBase = new ffmpeg.Rational(1, frameRate)
context.framerate = new ffmpeg.Rational(frameRate, 1)
context.bitRate = 200000
console.log('✓ Context configured')

console.log('Step 4: Opening context...')
context.open()
console.log('✓ Context opened')

console.log('Step 5: Creating frame...')
const frame = new ffmpeg.Frame()
console.log('✓ Frame created')

console.log('Step 6: Configuring frame...')
frame.width = width
frame.height = height
frame.format = ffmpeg.constants.pixelFormats.YUV420P
frame.pts = 0
console.log('✓ Frame configured')

console.log('Step 7: Allocating frame...')
frame.alloc()
console.log('✓ Frame allocated')

console.log('Step 8: Sending frame to encoder...')
context.sendFrame(frame)
console.log('✓ Frame sent')

console.log('Step 9: Creating packet...')
const packet = new ffmpeg.Packet()
console.log('✓ Packet created')

console.log('Step 10: Receiving packet from encoder...')
const received = context.receivePacket(packet)
console.log(`✓ Packet received: ${received}`)

if (received) {
  console.log(`   Packet size: ${packet.data.length} bytes`)
}

console.log('Step 11: Sending second frame...')
const frame2 = new ffmpeg.Frame()
frame2.width = width
frame2.height = height
frame2.format = ffmpeg.constants.pixelFormats.YUV420P
frame2.pts = 1
frame2.alloc()
context.sendFrame(frame2)
console.log('✓ Second frame sent')

console.log('Step 12: Receiving packet after second frame...')
const received2 = context.receivePacket(packet)
console.log(`✓ Packet received: ${received2}`)

console.log('Step 13: Flushing encoder with null frame...')
context.sendFrame(null)
console.log('✓ Flush sent')

console.log('Step 14: Receiving packets during flush...')
let flushCount = 0
while (context.receivePacket(packet)) {
  flushCount++
  console.log(`   Flush packet ${flushCount}: ${packet.data.length} bytes`)
}
console.log(`✓ Flush complete: ${flushCount} packets`)

console.log('\n✓ All steps completed successfully!')
