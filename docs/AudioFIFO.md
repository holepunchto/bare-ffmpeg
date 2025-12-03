# AudioFIFO

The `AudioFIFO` API provides a first in first out buffer for audio samples. This is useful for buffering audio data between different processing stages.

## Constructor

```js
const fifo = new ffmpeg.AudioFIFO(sampleFormat, channels, nbSamples)
```

### Parameters

- `sampleFormat` (`number` | `string`): The audio sample format
- `channels` (`number`): Number of audio channels
- `nbSamples` (`number`): Initial buffer size in samples

**Returns**: A new `AudioFIFO` instance

## Example

```js
const fifo = new ffmpeg.AudioFIFO(ffmpeg.constants.sampleFormats.S16, 2, 1024)
```

## Properties

### `AudioFIFO.size`

Gets the number of samples currently in the FIFO.

**Returns**: `number`

### `AudioFIFO.space`

Gets the number of samples that can be written to the FIFO.

**Returns**: `number`

## Methods

### `AudioFIFO.write(frame)`

Writes samples from a frame to the FIFO. The FIFO will automatically grow if needed.

**Parameters:**

- `frame` (`Frame`): The audio frame containing samples to write

**Returns**: `number` of samples written

### `AudioFIFO.read(frame, nbSamples)`

Reads samples from the FIFO into a frame.

**Parameters:**

- `frame` (`Frame`): The frame to read samples into
- `nbSamples` (`number`): Number of samples to read

**Returns**: `number` of samples actually read

### `AudioFIFO.peek(frame, nbSamples)`

Reads samples from the FIFO without removing them.

**Parameters:**

- `frame` (`Frame`): The frame to read samples into
- `nbSamples` (`number`): Number of samples to peek

**Returns**: `number` of samples peeked

### `AudioFIFO.drain(nbSamples)`

Removes samples from the FIFO without reading them.

**Parameters:**

- `nbSamples` (`number`): Number of samples to drain

**Returns**: `void`

### `AudioFIFO.reset()`

Resets the FIFO to empty state.

**Returns**: `void`

### `AudioFIFO.destroy()`

Destroys the `AudioFIFO` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
