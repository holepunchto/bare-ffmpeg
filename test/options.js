const test = require('brittle')
const ffmpeg = require('..')

const { options } = ffmpeg

test('getOption', (t) => {
  const ctx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const result = options.getOption(ctx._handle, 'threads')
  t.is(result, '1')
})

test('setOption', (t) => {
  const ctx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  options.setOption(ctx._handle, 'threads', '2')
  const result = options.getOption(ctx._handle, 'threads')
  t.is(result, '2')
})

test('listOptionNames', (t) => {
  const ctx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const result = options.listOptionNames(ctx._handle)
  t.ok(result && result.length)
})

test('getOptions', (t) => {
  const ctx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const result = options.getOptions(ctx._handle)
  t.ok(result && Object.keys(result).length)
})

test('copyOptions', (t) => {
  const source = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const target = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

  t.is(options.getOption(source._handle, 'threads'), '1')
  t.is(options.getOption(target._handle, 'threads'), '1')

  options.setOption(source._handle, 'threads', '2')
  options.copyOptions(target._handle, source._handle)

  const result = options.getOption(target._handle, 'threads')
  t.is(result, '2')
})

test('setOptionDictionary', (t) => {
  const ctx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const dictionary = ffmpeg.Dictionary.from({
    threads: '4',
    b: '128000'
  })

  options.setOptionDictionary(ctx._handle, dictionary._handle)

  t.is(options.getOption(ctx._handle, 'threads'), '4')
  t.is(options.getOption(ctx._handle, 'b'), '128000')

  dictionary.destroy()
})

test('setOptionDefaults', (t) => {
  const ctx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
  const before = options.getOptions(ctx._handle)
  options.setOptionDefaults(ctx._handle)
  const after = options.getOptions(ctx._handle)
  t.unlike(before, after)
})
