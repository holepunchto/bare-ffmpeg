const test = require('brittle')
const ffmpeg = require('..')

test('validity', (t) => {
  t.is(new ffmpeg.Rational(1, 60).valid, true)
  t.is(new ffmpeg.Rational(0, 1).valid, false)
  t.is(new ffmpeg.Rational(5, -1).valid, false)
  t.is(new ffmpeg.Rational(-5, 1).valid, true)

  t.is(new ffmpeg.Rational(0, 1).uninitialized, true)
  t.is(new ffmpeg.Rational(5, -1).uninitialized, false)
})

test('quantized to double', (t) => {
  const r = new ffmpeg.Rational(6, 2)
  t.is(r.q2d, 3)
})

test('double to quantized', (t) => {
  const r = ffmpeg.Rational.from(2.5)
  t.is(r.numerator, 5)
  t.is(r.denominator, 2)
})
