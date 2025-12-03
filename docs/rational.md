# Rational

The `Rational` API provides functionality to represent rational numbers (fractions).

## Constructor

```js
const rational = new ffmpeg.Rational(numerator, denominator)
```

### Parameters

- `numerator` (`number`): The numerator
- `denominator` (`number`): The denominator

**Returns**: A new `Rational` instance

## Properties

### `Rational.numerator`

Gets the numerator.

**Returns**: `number`

### `Rational.denominator`

Gets the denominator.

**Returns**: `number`

### `Rational.valid`

Returns if true if rational describes a non-zero & non-negative quantity.

**Returns**: `number`

### `Rational.uninitialized`

Returns if true when is not set.

**Returns**: `number`

## Methods

### `Rational.toNumber()`

see `av_q2d()`

**Returns**: `number`

## Static Methods

### `Rational.from(number)`

see `av_d2q()`

**Returns**: `Rational`

### `Rational.rescaleQ(number, timebaseA, timebaseB)`

see `av_rescale_q()`

**Returns**: `number`
