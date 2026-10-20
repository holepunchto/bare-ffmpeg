const test = require('brittle')
const os = require('bare-os')
const process = require('bare-process')
const ffmpeg = require('..')

test('input format should instantiate', (t) => {
  t.ok(new ffmpeg.InputFormat())
})

test('InputFormat should expose an extensions getter', (t) => {
  const inputFormat = new ffmpeg.InputFormat('webm')
  t.is(inputFormat.extensions, 'mkv,mk3d,mka,mks,webm')
})

test('InputFormat should expose an mimeType getter', (t) => {
  const inputFormat = new ffmpeg.InputFormat('webm')
  t.is(inputFormat.mimeType, 'audio/webm,audio/x-matroska,video/webm,video/x-matroska')
})

test('InputFormat should expose an name getter', (t) => {
  const inputFormat = new ffmpeg.InputFormat('webm')
  t.is(inputFormat.name, 'matroska,webm')
})

test('InputFormat should expose a static method to create from handle', (t) => {
  const handle = new ArrayBuffer(8)

  const inputFormat = ffmpeg.InputFormat.from(handle)

  t.ok(inputFormat)
})

test('InputFormat.listDevices throws when the format cannot list devices', (t) => {
  t.exception(() => ffmpeg.InputFormat.listDevices('webm'))
})

test('InputFormat.listDevices throws without a valid format name', (t) => {
  t.exception.all(() => ffmpeg.InputFormat.listDevices(null), TypeError)
  t.exception.all(() => ffmpeg.InputFormat.listDevices(123), TypeError)
  t.exception(() => ffmpeg.InputFormat.listDevices('nope'))
})

test('InputFormat throws when the name is not a string', (t) => {
  t.exception.all(() => new ffmpeg.InputFormat(null), TypeError)
  t.exception.all(() => new ffmpeg.InputFormat(123), TypeError)
})

// Depends on the devices of the machine, dshow fails when there's no microphone
const deviceFormat = { linux: 'v4l2', win32: 'dshow', darwin: 'avfoundation' }[os.platform()]
const deviceFilter = { skip: !deviceFormat || process.env.CI }

test('InputFormat.listDevices returns an array of devices', deviceFilter, (t) => {
  const devices = ffmpeg.InputFormat.listDevices(deviceFormat)
  t.ok(Array.isArray(devices))

  for (const device of devices) {
    t.is(typeof device.name, 'string')
    t.is(typeof device.description, 'string')
    t.is(typeof device.default, 'boolean')
    t.ok(Array.isArray(device.mediaTypes))
  }
})

test('InputFormat.listDevices filters by media type', deviceFilter, (t) => {
  const { AUDIO } = ffmpeg.constants.mediaTypes

  const all = ffmpeg.InputFormat.listDevices(deviceFormat)
  const audio = ffmpeg.InputFormat.listDevices(deviceFormat, { mediaType: AUDIO })

  t.alike(
    audio,
    all.filter((device) => device.mediaTypes.includes(AUDIO))
  )
})
