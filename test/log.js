const test = require('brittle')
const ffmpeg = require('..')

test('get log level', (t) => {
  t.is(ffmpeg.log.level, ffmpeg.log.ERROR)
})

test('set log level', (t) => {
  ffmpeg.log.level = ffmpeg.log.INFO
  t.is(ffmpeg.log.level, ffmpeg.log.INFO)
})
