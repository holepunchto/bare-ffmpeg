const test = require('brittle')
const ffmpeg = require('..')

test('audio - init', (t) => {
  const audio = new ffmpeg.Audio('S16', 2, 1024, 1)

  t.is(audio.data.byteLength, 4096)
})
