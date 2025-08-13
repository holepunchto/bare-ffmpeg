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

test('stringifies numbers', (t) => {
  const dict = new ffmpeg.Dictionary()
  dict.set('a', 1234)
  t.is(dict.get('a'), '1234')
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

test('it should expose an entries method', (t) => {
  const dict = new ffmpeg.Dictionary()
  dict.set('foo', 'bar')
  dict.set('boo', 'baz')

  let entries = dict.entries()

  t.alike(entries.at(0), ['foo', 'bar'])
  t.alike(entries.at(1), ['boo', 'baz'])
})

test('it should expose an iterator', (t) => {
  const dict = new ffmpeg.Dictionary()
  dict.set('foo', 'bar')
  dict.set('boo', 'baz')

  let result = []
  for (const [key, value] of dict) result.push({ key, value })

  t.is(result.at(0).key, 'foo')
  t.is(result.at(0).value, 'bar')
  t.is(result.at(1).key, 'boo')
  t.is(result.at(1).value, 'baz')
})
