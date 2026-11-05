# Samples

The `Samples` API gives a `Buffer` view of the audio of a `Frame`. A frame stores its samples in native memory; `Samples` either makes a frame store them in a `Buffer` instead, with `fill()`, or copies them out, with `read()`.

## Constructor

```js
const samples = new ffmpeg.Samples([options])
```

### Parameters

- `options.noAlignment` (`boolean`, optional): Lay the samples out without padding between planes. Defaults to `false`

**Returns**: A new `Samples` instance

## Properties

### `Samples.data`

The buffer holding the samples, sized by the last `fill()` or `read()`. For a planar format, one plane follows the other; for an interleaved format, the channels alternate.

**Returns**: `Buffer`

### `Samples.format`

The sample format of the frame last given to `fill()`.

**Returns**: `number`

### `Samples.channelLayout`

The channel layout of the frame last given to `fill()`.

**Returns**: `ChannelLayout`

### `Samples.nbChannels`

The number of channels of the frame last given to `fill()`.

**Returns**: `number`

### `Samples.nbSamples`

The number of samples per channel of the frame last given to `fill()`.

**Returns**: `number`

### `Samples.pts`

The presentation timestamp of the frame last given to `fill()`.

**Returns**: `number`

## Methods

### `Samples.fill(frame)`

Points the frame at `data`: from now on the frame reads and writes its samples through this buffer. Writing PCM into `data` then feeds an encoder, and decoding into the frame lands in `data`. The buffer is allocated, or reused when the size has not changed.

**Parameters:**

- `frame` (`Frame`): A frame with its format, channel layout and sample count set

**Returns**: `number` - The size of `data` in bytes

### `Samples.read(frame)`

Copies the samples of `frame` into `data`. The frame keeps its own storage.

**Parameters:**

- `frame` (`Frame`): The frame to copy from

**Returns**: `void`

### `Samples.copy(frame[, dstOffset[, srcOffset]])`

Copies the samples of the frame last given to `fill()` into `frame`, sample by sample, as `av_samples_copy()` does.

**Parameters:**

- `frame` (`Frame`): The frame to copy into
- `dstOffset` (`number`, optional): The first sample to write in `frame`. Defaults to `0`
- `srcOffset` (`number`, optional): The first sample to read. Defaults to `0`

**Returns**: `void`

## Static Methods

### `Samples.bufferSize(format, nbChannels, nbSamples[, noAlignment])`

The number of bytes that samples of this shape take, as `av_samples_get_buffer_size()` computes it.

**Parameters:**

- `format` (`number`): The sample format, from `constants.sampleFormats`
- `nbChannels` (`number`): The number of channels
- `nbSamples` (`number`): The number of samples per channel
- `noAlignment` (`boolean`, optional): Without padding between planes. Defaults to `false`

**Returns**: `number`

## Example

```js
const frame = new ffmpeg.Frame()
frame.format = ffmpeg.constants.sampleFormats.S16
frame.channelLayout = ffmpeg.ChannelLayout.from('STEREO')
frame.nbSamples = 1024
frame.alloc()

const samples = new ffmpeg.Samples()
const size = samples.fill(frame)

// `frame` now stores its samples in `samples.data`
const pcm = new Int16Array(samples.data.buffer, samples.data.byteOffset, size / 2)
pcm.fill(0)

encoder.sendFrame(frame)
```
