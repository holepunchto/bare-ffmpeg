const test = require('brittle')
const ffmpeg = require('..')
const { Rational } = ffmpeg

test('validity', (t) => {
  t.is(new Rational(1, 60).valid, true)
  t.is(new Rational(0, 1).valid, false)
  t.is(new Rational(5, -1).valid, false)
  t.is(new Rational(-5, 1).valid, true)

  t.is(new Rational(0, 1).uninitialized, true)
  t.is(new Rational(5, -1).uninitialized, false)
})

test('quantized to double', (t) => {
  const r = new Rational(6, 2)
  t.is(r.toNumber(), 3)
})

test('double to quantized', (t) => {
  const r = Rational.from(2.5)
  t.is(r.numerator, 5)
  t.is(r.denominator, 2)
})

test('static rescaleQ()', (t) => {
  const x = 120
  const a = new Rational(1, 60)
  const b = new Rational(1, 1000)

  const y = Rational.rescaleQ(x, a, b)
  t.is(y, 2000, 'rescaled')
})
