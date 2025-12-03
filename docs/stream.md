# Stream

The `Stream` API provides functionality to access media stream information and create decoders/encoders.

## Constructor

```js
const stream = new ffmpeg.Stream(handle)
```

### Parameters

- `handle` (`ArrayBuffer`): Internal stream handle

**Returns**: A new `Stream` instance

> Streams are typically obtained from format contexts: `const stream = format.streams[0]`

## Properties

### `Stream.id`

Gets or sets the stream ID.

**Returns**: `number`

### `Stream.index`

Gets the stream index.

**Returns**: `number`

### `Stream.codec`

Gets the codec for this stream.

**Returns**: `Codec` instance

### `Stream.codecParameters`

Gets the codec parameters for this stream.

**Returns**: `CodecParameters` instance

### `Stream.timeBase`

Gets or sets the time base for the stream.

**Returns**: `Rational` instance

### `Stream.avgFramerate`

Gets or sets the average framerate for video streams.

**Returns**: `Rational` instance

**Example:**

```js
const fps = stream.avgFramerate.toNumber()
```

### `Stream.duration`

Gets or sets the duration of the stream in time base units.

**Returns**: `number` - Duration in time base units, or `0` if unknown

## Methods

### `Stream.decoder()`

Creates a decoder for this stream.

**Returns**: `CodecContext` instance

### `Stream.encoder()`

Creates an encoder for this stream.

**Returns**: `CodecContext` instance
