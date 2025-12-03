# CodecContext

The `CodecContext` API provides functionality to encode or decode media frames.

## Constructor

```js
const codecCtx = new ffmpeg.CodecContext(codec)
```

### Parameters

- `codec` (Codec): The codec to use (e.g., `ffmpeg.Codec.H264.encoder`)

**Returns**: A new `CodecContext` instance

## Properties

### `CodecContext.timeBase`

Gets or sets the time base for the codec context.

**Returns**: `Rational` instance

### `CodecContext.pixelFormat`

Gets or sets the pixel format for video codecs.

**Returns**: `number` (pixel format constant)

### `CodecContext.width`

Gets or sets the frame width for video codecs.

**Returns**: `number`

### `CodecContext.height`

Gets or sets the frame height for video codecs.

**Returns**: `number`

### `CodecContext.frameSize`

Gets the number of samples per channel in an audio frame.

**Returns**: `number`

### `CodecContext.frameNum`

When encoding this gets the total number of frames passed to the encoder so far.

When decoding this gets the total number of frames returned from the decoder so far.

**Returns**: `number`

### `CodecContext.requestSampleFormat`

_Only when decoding_

Set to before calling `context.open()` to hint decoder of preferred output format if supported.

Always rely on `CodecContext.sampleFormat` for actual decoded format.

**Returns**: `number`

### `CodecContext.getFormat`

_Only when decoding_

Sets a callback function for pixel format negotiation during decoding. Called when FFmpeg needs to choose between multiple supported formats, typically for hardware acceleration.

**Type**: `function` (setter only)

**Callback Signature**: `(context: CodecContext, formats: number[]) => number`

**Parameters:**

- `context` (`CodecContext`): The codec context instance
- `formats` (`number[]`): Array of available pixel format constants

**Returns**: `number` - The chosen pixel format constant from the provided array

Must be set before calling `context.open()`.

## Methods

### `CodecContext.open([options])`

Opens the codec context for encoding/decoding.

**Parameters:**

- `options` (`Dictionary`, optional): Codec-specific options

**Returns**: `void`

### `CodecContext.sendFrame(frame)`

Sends a frame to the encoder.

**Parameters:**

- `frame` (`Frame`): The frame to encode

**Returns**: `boolean` indicating if the frame was sent

### `CodecContext.receiveFrame(frame)`

Receives a decoded frame from the decoder.

**Parameters:**

- `frame` (`Frame`): The frame to store the decoded data

**Returns**: `boolean` indicating if a frame was received

### `CodecContext.sendPacket(packet)`

Sends a packet to the decoder.

**Parameters:**

- `packet` (`Packet`): The packet to decode

**Returns**: `boolean` indicating if the packet was sent

### `CodecContext.receivePacket(packet)`

Receives an encoded packet from the encoder.

**Parameters:**

- `packet` (`Packet`): The packet to store the encoded data

**Returns**: `boolean` indicating if a packet was received

### `CodecContext.getSupportedConfig(config)`

Gets the supported values for a codec configuration option.

**Parameters:**

- `config` (`number`): The configuration type from `ffmpeg.constants.codecConfig`

**Returns**:

- For `PIX_FORMAT`, `SAMPLE_FORMAT`, `COLOR_RANGE`, `COLOR_SPACE`: `Int32Array` of supported values (all valid values are included if the codec has no restrictions)
- For `SAMPLE_RATE`: `Int32Array` of supported sample rates or `null` if the codec accepts any valid sample rate
- For `FRAME_RATE`: Array of `Rational` instances or `null` if the codec accepts any valid frame rate
- For `CHANNEL_LAYOUT`: Array of `ChannelLayout` instances or `null` if the codec accepts any valid channel layout

**Throws**: Error if the config type is not applicable to this codec (e.g., asking for pixel formats from an audio codec)

**Examples:**

```js
const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

const pixelFormats = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.PIX_FORMAT)
if (pixelFormats) {
  console.log('Supported pixel formats:', pixelFormats)
}

const frameRates = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.FRAME_RATE)
if (frameRates) {
  frameRates.forEach((rate) => {
    console.log(`${rate.toNumber()} fps`)
  })
}

const layouts = codecCtx.getSupportedConfig(ffmpeg.constants.codecConfig.CHANNEL_LAYOUT)
if (layouts) {
  console.log('Supported channel layouts:', layouts)
}
```

### `CodecContext.getOption(name[, flags])`

Gets the value of a codec option.

**Parameters:**

- `name` (`string`): The option name (for example, `'threads'` or `'crf'`)
- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `string` value or `null` when the option is unset

### `CodecContext.setOption(name, value[, flags])`

Sets a codec option.

**Parameters:**

- `name` (`string`): The option name to set
- `value` (`string`): The option value
- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `void`

### `CodecContext.setOptionDictionary(dictionary[, flags])`

Sets options from a `Dictionary`. Ownership of the dictionary is retained by the caller.

**Parameters:**

- `dictionary` (`Dictionary`): Dictionary of option key/value pairs
- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `void`

### `CodecContext.setOptionDefaults()`

Resets codec options to their defaults.

**Returns**: `void`

### `CodecContext.listOptionNames([flags])`

Lists option names available on the codec context.

**Parameters:**

- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `Array<string>` of option names

### `CodecContext.getOptions([flags])`

Collects option values into a plain object.

**Parameters:**

- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `object` mapping option names to string values

### `CodecContext.copyOptionsFrom(context)`

Copies options from another codec context.

**Parameters:**

- `context` (`CodecContext`): Source context whose options should be copied

**Returns**: `void`

**Example:**

```js
using source = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)
using target = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

source.setOption('crf', '28')
source.setOption('threads', '4')
source.setOptionDictionary(ffmpeg.Dictionary.from({ preset: 'slow' }))

target.setOptionDefaults()
target.copyOptionsFrom(source)

console.log(target.getOptions())
```

### `CodecContext.destroy()`

Destroys the `CodecContext` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
