# CodecParameters

The `CodecParameters` API provides functionality to access codec parameters from streams.

```js
const params = stream.codecParameters // Get from stream
```

## Properties

### `CodecParameters.type`

General type of the encoded data.

**Returns**: `number`

### `CodecParameters.id`

Specific type of the encoded data (the codec used).

**Returns**: `number`

### `CodecParameters.tag`

Additional information about the codec (corresponds to the AVI FOURCC).

**Returns**: `number`

### `CodecParameters.bitRate`

Gets the bit rate.

**Returns**: `number`

### `CodecParameters.bitsPerCodedSample`

Gets the bits per coded sample.

**Returns**: `number`

### `CodecParameters.bitsPerRawSample`

Gets the bits per raw sample.

**Returns**: `number`

### `CodecParameters.sampleRate`

Gets the sample rate for audio codecs.

**Returns**: `number`

### `CodecParameters.frameRate`

Gets the frame rate for video codecs.

**Returns**: `Rational`

### `CodecParameters.extraData`

Out-of-band global headers that may be used by some codecs.

**Returns**: `Buffer`

### `CodecParameters.profile`

Codec-specific bitstream restrictions that the stream conforms to.

**Returns**: `number`

### `CodecParameters.level`

Codec-specific bitstream restrictions that the stream conforms to.

**Returns**: `number`

### `CodecParameters.format`

Video: the pixel format, the value corresponds to AVPixelFormat.
Audio: the sample format, the value corresponds to AVSampleFormat.

**Returns**: `number`

### `CodecParameters.nbChannels`

Number of channels in the layout.

**Returns**: `number`

### `CodecParameters.channelLayout`

Gets or sets the channel layout, see `ffmpeg.constants.channelLayouts`

**Returns**: `ChannelLayout`

### `CodecParameters.blockAlign`

Audio only. The number of bytes per coded audio frame, required by some
formats.

Corresponds to `nBlockAlign` in `WAVEFORMATEX`.

**Returns**: `number`

### `CodecParameters.initalPadding`

Audio only. The amount of padding (in samples) inserted by the encoder at the beginning of the audio. I.e. this number of leading decoded samples must be discarded by the caller to get the original audio without leading padding.

**Returns**: `number`

### `CodecParameters.trailingPadding`

Audio only. The amount of padding (in samples) appended by the encoder to the end of the audio. I.e. this number of decoded samples must be discarded by the caller from the end of the stream to get the original audio without any trailing padding.

**Returns**: `number`

### `CodecParameters.seekPreroll`

Audio only. Number of samples to skip after a discontinuity.

**Returns**: `number`

### `CodecParameters.sampleAspectRatio`

Video only. The aspect ratio (width / height) which a single pixel should have when displayed.

When the aspect ratio is unknown / undefined, the numerator should be set to 0 (the denominator may have any value).

**Returns**: `number`

### `CodecParameters.videoDelay`

Video only. Number of delayed frames.

**Returns**: `number`

## Methods

### `CodecParameters.fromContext(context)`

Copies parameters from a codec context.

**Parameters:**

- `context` (`CodecContext`): The codec context

**Returns**: `void`

### `CodecParameters.toContext(context)`

Copies parameters to a codec context.

**Parameters:**

- `context` (`CodecContext`): The codec context

**Returns**: `void`
