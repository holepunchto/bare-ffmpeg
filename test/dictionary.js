const test = require('brittle')
const ffmpeg = require('..')

test('dictionary', (t) => {
  t.test('basic set/get', (t) => {
    const dict = new ffmpeg.Dictionary()

    dict.set('foo', 'bar')
    t.is(dict.get('foo'), 'bar', 'retrieves value after set')
  })

  t.test('multiple entries', (t) => {
    const dict = new ffmpeg.Dictionary()

    dict.set('a', '1')
    dict.set('b', '2')
    dict.set('c', '3')

    t.is(dict.get('a'), '1')
    t.is(dict.get('b'), '2')
    t.is(dict.get('c'), '3')
  })

  t.test('overwrite existing key', (t) => {
    const dict = new ffmpeg.Dictionary()

    dict.set('foo', 'bar')
    dict.set('foo', 'baz')

    t.is(dict.get('foo'), 'baz', 'last write wins')
  })

  t.test('non-existent key returns null', (t) => {
    const dict = new ffmpeg.Dictionary()

    t.is(dict.get('missing'), null, 'getting unknown key yields null')
  })

  t.test('handles empty string keys', (t) => {
    const dict = new ffmpeg.Dictionary()

    dict.set('', 'empty')
    t.is(dict.get(''), 'empty')
  })

  t.test('handles empty string values', (t) => {
    const dict = new ffmpeg.Dictionary()

    dict.set('key', '')
    t.is(dict.get('key'), '')
  })
})
