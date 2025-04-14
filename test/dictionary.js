const test = require('brittle')
const ffmpeg = require('..')

test('dictionary', (t) => {
  const dict = new ffmpeg.Dictionary()

  dict.set('foo', 'bar')

  t.alike(dict.get('foo'), 'bar')
})
