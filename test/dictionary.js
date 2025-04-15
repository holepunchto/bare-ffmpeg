const test = require('brittle')
const ffmpeg = require('..')

test('basic set/get', (t) => {
  const dict = new ffmpeg.Dictionary()

  dict.set('foo', 'bar')
  t.is(dict.get('foo'), 'bar', 'retrieves value after set')
})

test('multiple entries', (t) => {
  const dict = new ffmpeg.Dictionary()

  dict.set('a', '1')
  dict.set('b', '2')
  dict.set('c', '3')

  t.is(dict.get('a'), '1')
  t.is(dict.get('b'), '2')
  t.is(dict.get('c'), '3')
})

test('overwrite existing key', (t) => {
  const dict = new ffmpeg.Dictionary()

  dict.set('foo', 'bar')
  dict.set('foo', 'baz')

  t.is(dict.get('foo'), 'baz', 'last write wins')
})

test('non-existent key returns null', (t) => {
  const dict = new ffmpeg.Dictionary()

  t.is(dict.get('missing'), null, 'getting unknown key yields null')
})

test('set throw when key is empty', (t) => {
  const dict = new ffmpeg.Dictionary()

  t.exception.all(() => {
    dict.set('', 'bar')
  }, 'Key should be a non empty string')
})

test('set throw when value is empty', (t) => {
  const dict = new ffmpeg.Dictionary()

  t.exception.all(() => {
    dict.set('foo', '')
  }, 'Value should be a non empty string')
})

test('get throw when key is empty', (t) => {
  const dict = new ffmpeg.Dictionary()

  t.exception.all(() => {
    dict.get('')
  }, 'Key should be a non empty string')
})
