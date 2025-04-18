const test = require('brittle')
const ffmpeg = require('..')

test('frame expose a setter for width', (t) => {
  const fr = new ffmpeg.Frame()
  fr.width = 200;
})

test('frame expose a getter for width', (t) => {
  const fr = new ffmpeg.Frame()
  fr.width = 200

  t.ok(fr.width == 200)
})
