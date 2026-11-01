# Resampler

The `Resampler` API provides functionality to convert audio between different sample rates, channel layouts, and sample formats.

## Constructor

```js
const resampler = new ffmpeg.Resampler(
  inputSampleRate,
  inputChannelLayout,
  inputSampleFormat,
  outputSampleRate,
  outputChannelLayout,
  outputSampleFormat
)
```

### Parameters

- `inputSampleRate` (`number`): Input sample rate in Hz
- `inputChannelLayout` (`number` | `string`): Input channel layout constant or name (e.g., `'STEREO'`)
- `inputSampleFormat` (`number` | `string`): Input sample format constant or name (e.g., `'S16'`)
- `outputSampleRate` (`number`): Output sample rate in Hz
- `outputChannelLayout` (`number` | `string`): Output channel layout constant or name (e.g., `'STEREO'`)
- `outputSampleFormat` (`number` | `string`): Output sample format constant or name (e.g., `'FLT'`)

**Returns**: A new `Resampler` instance

## Properties

### `Resampler.inputSampleRate`

Gets the input sample rate.

**Returns**: `number`

### `Resampler.outputSampleRate`

Gets the output sample rate.

**Returns**: `number`

### `Resampler.delay`

Gets the resampler delay in samples.

**Returns**: `number`

## Methods

### `Resampler.getOutSamples(inputSamples)`

Gets an upper bound for the number of output samples the next `convert()` call will produce for `inputSamples` input samples, including any samples buffered from previous calls. Useful for sizing the output frame.

**Parameters:**

- `inputSamples` (`number`): Number of input samples

**Returns**: `number`

```js
outputFrame.nbSamples = resampler.getOutSamples(inputFrame.nbSamples)
outputFrame.alloc()
```

### `Resampler.convert(inputFrame, outputFrame)`

Converts audio data from input frame to output frame. Throws if either frame's sample format or channel count differs from those the resampler was created with.

**Parameters:**

- `inputFrame` (`Frame`): The input audio frame
- `outputFrame` (`Frame`): The output audio frame

**Returns**: `number` of samples converted

### `Resampler.flush(outputFrame)`

Flushes any remaining samples in the resampler. Throws if the output frame's sample format or channel count differs from those the resampler was created with.

**Parameters:**

- `outputFrame` (`Frame`): The output audio frame

**Returns**: `number` of samples flushed

### `Resampler.destroy()`

Destroys the `Resampler` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
