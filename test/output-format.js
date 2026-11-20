const test = require('brittle')
const os = require('bare-os')
const ffmpeg = require('..')

test('it should expose an OutputFormat class', (t) => {
  t.ok(new ffmpeg.OutputFormat('webm'))
})

test('OutputFormat should expose an extensions getter', (t) => {
  const outputFormat = new ffmpeg.OutputFormat('webm')
  t.is(outputFormat.extensions, 'webm')
})

test('OutputFormat should expose an mimeType getter', (t) => {
  const outputFormat = new ffmpeg.OutputFormat('webm')
  t.is(outputFormat.mimeType, 'video/webm')
})

test('OutputFormat should expose an mimeType getter', (t) => {
  const outputFormat = new ffmpeg.OutputFormat('webm')
  t.is(outputFormat.name, 'webm')
})

test('OutputFormat should expose a static method to create from handle', (t) => {
  const handle = new ArrayBuffer(8)

  const outputFormat = ffmpeg.OutputFormat.from(handle)

  t.ok(outputFormat)
})

test('OutputFormat.listDevices throws when the format cannot list devices', (t) => {
  t.exception(() => ffmpeg.OutputFormat.listDevices('webm'))
})

test('OutputFormat.listDevices throws without a valid format name', (t) => {
  t.exception.all(() => ffmpeg.OutputFormat.listDevices(), TypeError)
  t.exception.all(() => ffmpeg.OutputFormat.listDevices(null), TypeError)
  t.exception.all(() => ffmpeg.OutputFormat.listDevices(123), TypeError)
  t.exception(() => ffmpeg.OutputFormat.listDevices('nope'))
})

test('OutputFormat throws when the name is not a string', (t) => {
  t.exception.all(() => new ffmpeg.OutputFormat(), TypeError)
  t.exception.all(() => new ffmpeg.OutputFormat(null), TypeError)
})

// libpulse is loaded on demand, so pulse is available only where the library
// is installed. Either way the process survives.
const pulseFilter = { skip: os.platform() !== 'linux' }

test('OutputFormat pulse opens or throws, never kills the process', pulseFilter, (t) => {
  try {
    t.ok(Array.isArray(ffmpeg.OutputFormat.listDevices('pulse')))
  } catch (err) {
    t.ok(err.message.includes("Output format 'pulse' is not available"), err.message)
  }
})
