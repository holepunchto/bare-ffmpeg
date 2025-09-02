# bare-ffmpeg

Low-level FFmpeg bindings for Bare.

```
npm i bare-ffmpeg
```

## API

### `IOContext`

The `IOContext` API provides functionality to create input/output contexts for media files with support for streaming and custom I/O operations.

```js
const io = new ffmpeg.IOContext(buffer[, options])
```

Parameters:

- `buffer` (`Buffer` | `number`): The media data buffer or buffer size for streaming
- `options` (`object`, optional): Configuration options
  - `onread` (`function`): A function for refilling the buffer.
  - `onwrite` (`function`): A function for writing the buffer contents.
  - `onseek` (`function`): A function for seeking to specified byte position.

**Returns**: A new `IOContext` instance

#### Constructor Options

##### `onread(buffer, requestedLen)`

Callback function called when FFmpeg needs to read data. For streaming scenarios where data is not available in a single buffer.

Parameters:

- `buffer` (`Buffer`): Buffer to fill with data
- `requestedLen` (`number`): Number of bytes requested

**Returns**: `number` - Number of bytes actually read, or 0 for EOF

##### `onwrite(buffer)`

Callback function called when FFmpeg needs to write data. For streaming output scenarios.

Parameters:

- `buffer` (`Buffer`): Buffer containing data to write

**Returns**: `number` - Number of bytes written

##### `onseek(offset, whence)`

Callback function called when FFmpeg needs to seek within the data source.

Parameters:

- `offset` (`number`): Offset to seek to
- `whence` (`number`): Seek mode (see `ffmpeg.constants.seek`)

**Returns**: `number` - New position or file size for `AVSEEK_SIZE`

#### Examples

**Basic usage with buffer:**

```js
const image = require('./fixtures/image/sample.jpeg', {
  with: { type: 'binary' }
})
const io = new ffmpeg.IOContext(image)
io.destroy()
```

**Streaming with custom read callback:**

```js
const io = new ffmpeg.IOContext(4096, {
  onread: (buffer) => {
    const bytesToRead = Math.min(buffer.length, data.length - offset)
    if (bytesToRead === 0) return 0

    const chunk = data.subarray(offset, offset + bytesToRead)
    buffer.set(chunk)
    offset += bytesToRead
    return bytesToRead
  }
})
```

**Streaming with seek support:**

```js
const io = new ffmpeg.IOContext(4096, {
  onread: (buffer) => {
    // ... read implementation
  },
  onseek: (offset, whence) => {
    switch (whence) {
      case ffmpeg.constants.seek.SIZE:
        return data.length
      case ffmpeg.constants.seek.SEEK_SET:
        offset = offset
        return offset
      default:
        return -1
    }
  }
})
```

#### Methods

##### `IOContext.destroy()`

Destroys the `IOContext` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `Dictionary`

The `Dictionary` API provides functionality to store and retrieve key-value pairs, commonly used for passing options to various FFmpeg components.

```js
const dict = new ffmpeg.Dictionary()
```

**Returns**: A new `Dictionary` instance

Example:

```js
const dict = new ffmpeg.Dictionary()
dict.set('video_codec', 'h264')
dict.set('audio_codec', 'aac')
dict.set('bitrate', '1000k')
```

#### Methods

##### `Dictionary.set(key, value)`

Sets a key-value pair in the dictionary. Non-string values are automatically converted to strings.

Parameters:

- `key` (`string`): The dictionary key
- `value` (`string` | `number`): The value to store

**Returns**: `void`

##### `Dictionary.get(key)`

Retrieves a value from the dictionary by key.

Parameters:

- `key` (`string`): The dictionary key

**Returns**: `string` value or `null` if the key doesn't exist

##### `Dictionary.entries()`

Retrieves all keys and values.

**Returns**: `Array<[string, string]>` value

##### `Dictionary.destroy()`

Destroys the `Dictionary` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

#### Iteration

The `Dictionary` class implements the iterator protocol, allowing you to iterate over all key-value pairs:

```js
const dict = new ffmpeg.Dictionary()
dict.set('foo', 'bar')
dict.set('baz', 'qux')

for (const [key, value] of dict) {
  console.log(`${key}: ${value}`)
}
```

#### Static methods

##### `Dictionary.from(object)`

A helper to create a `Dictionary` instance from an object.

```js
const dict = ffmpeg.Dictionary.from({
  foo: 'bar',
  baz: 'qux'
})
```

**Returns**: A new `Dictionary` instance

### `FormatContext`

The `FormatContext` API provides the base functionality for reading and writing media files.

> This is the base class that `InputFormatContext` and `OutputFormatContext` extend.

#### Properties

##### `FormatContext.io`

Gets the IO context associated with this format context.

**Returns**: `IOContext` instance or `null`

##### `FormatContext.streams`

Gets the array of media streams.

**Returns**: Array of `Stream` instances

#### Methods

##### `FormatContext.readFrame(packet)`

Reads the next frame from the media file into a packet.

Parameters:

- `packet` (`Packet`): The packet to store the frame data

**Returns**: `boolean` indicating if a frame was read

##### `FormatContext.getBestStream(type)`

Gets the best stream of the specified media type.

Parameters:

- `type` (`number`): The media type from `ffmpeg.constants.mediaTypes`

**Returns**: `Stream` instance or `null` if not found

##### `FormatContext.destroy()`

Destroys the `FormatContext` and frees all associated resources including streams. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `InputFormatContext`

The `InputFormatContext` API extends `FormatContext` to provide functionality for reading media files.

```js
const format = new ffmpeg.InputFormatContext(io, options[, url])
```

Parameters:

- `io` (`IOContext` | `InputFormat`): The IO context or input format. The ownership of `io` is transferred.
- `options` (`Dictionary`): Format options. Required when using `InputFormat`, ignored when using `IOContext`. The ownership of `options` is transferred.
- `url` (`string`, optional): Media source URL. Defaults to a platform-specific value

**Returns**: A new `InputFormatContext` instance

#### Methods

##### `InputFormatContext.destroy()`

Destroys the `InputFormatContext` and closes the input format. Automatically called when the object is managed by a `using` declaration.

**Returns**: void

### `OutputFormatContext`

The `OutputFormatContext` API extends `FormatContext` to provide functionality for writing media files.

```js
const format = new ffmpeg.OutputFormatContext(formatName, io)
```

Parameters:

- `formatName` (`string`): The output format name (e.g., `'mp4'`, `'avi'`)
- `io` (`IOContext`): The IO context for writing. The ownership of `io` is transferred.

**Returns**: A new `OutputFormatContext` instance

#### Methods

##### `OutputFormatContext.createStream(codec)`

Creates a new stream in the output format.

Parameters:

- `codec` (`Codec`): The codec to use for the stream

**Returns**: A new `Stream` instance

##### `OutputFormatContext.destroy()`

Destroys the `OutputFormatContext` and closes the output format. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `Codec`

The `Codec` API provides access to FFmpeg codecs for encoding and decoding.

#### Static properties

##### `Codec.H264`

H.264 video codec.

**Returns**: `Codec` instance

##### `Codec.MJPEG`

Motion JPEG video codec.

**Returns**: `Codec` instance

##### `Codec.AAC`

AAC audio codec.

**Returns**: `Codec` instance

##### `Codec.AV1`

AV1 video codec.

**Returns**: `Codec` instance

#### Properties

##### `Codec.id`

Gets the codec ID.

**Returns**: `number`

##### `Codec.encoder`

Gets the encoder for this codec.

**Returns**: `Encoder` instance

##### `Codec.decoder`

Gets the decoder for this codec.

**Returns**: `Decoder` instance

#### Methods

##### `Codec.for(id)`

Gets a codec by ID.

Parameters:

- `id` (`number`): The codec ID

**Returns**: `Codec` instance

### `CodecContext`

The `CodecContext` API provides functionality to encode or decode media frames.

```js
const codecCtx = new ffmpeg.CodecContext(codec)
```

Parameters:

- `codec` (Codec): The codec to use (e.g., `ffmpeg.Codec.H264.encoder`)

**Returns**: A new `CodecContext` instance

#### Properties

##### `CodecContext.timeBase`

Gets or sets the time base for the codec context.

**Returns**: `Rational` instance

##### `CodecContext.pixelFormat`

Gets or sets the pixel format for video codecs.

**Returns**: `number` (pixel format constant)

##### `CodecContext.width`

Gets or sets the frame width for video codecs.

**Returns**: `number`

##### `CodecContext.height`

Gets or sets the frame height for video codecs.

**Returns**: `number`

#### Methods

##### `CodecContext.open([options])`

Opens the codec context for encoding/decoding.

Parameters:

- `options` (`Dictionary`, optional): Codec-specific options

**Returns**: `CodecContext` instance (for chaining)

##### `CodecContext.sendFrame(frame)`

Sends a frame to the encoder.

Parameters:

- `frame` (`Frame`): The frame to encode

**Returns**: `boolean` indicating if the frame was sent

##### `CodecContext.receiveFrame(frame)`

Receives a decoded frame from the decoder.

Parameters:

- `frame` (`Frame`): The frame to store the decoded data

**Returns**: `boolean` indicating if a frame was received

##### `CodecContext.sendPacket(packet)`

Sends a packet to the decoder.

Parameters:

- `packet` (`Packet`): The packet to decode

**Returns**: `boolean` indicating if the packet was sent

##### `CodecContext.receivePacket(packet)`

Receives an encoded packet from the encoder.

Parameters:

- `packet` (`Packet`): The packet to store the encoded data

**Returns**: `boolean` indicating if a packet was received

##### `CodecContext.destroy()`

Destroys the `CodecContext` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `CodecParameters`

The `CodecParameters` API provides functionality to access codec parameters from streams.

```js
const params = stream.codecParameters // Get from stream
```

#### Properties

##### `CodecParameters.type`

General type of the encoded data.

**Returns**: `number`

##### `CodecParameters.id`

Specific type of the encoded data (the codec used).

**Returns**: `number`

##### `CodecParameters.tag`

Additional information about the codec (corresponds to the AVI FOURCC).

**Returns**: `number`

##### `CodecParameters.bitRate`

Gets the bit rate.

**Returns**: `number`

##### `CodecParameters.bitsPerCodedSample`

Gets the bits per coded sample.

**Returns**: `number`

##### `CodecParameters.bitsPerRawSample`

Gets the bits per raw sample.

**Returns**: `number`

##### `CodecParameters.sampleRate`

Gets the sample rate for audio codecs.

**Returns**: `number`

##### `CodecParameters.frameRate`

Gets the frame rate for video codecs.

**Returns**: `Rational`

##### `CodecParameters.extraData`

Out-of-band global headers that may be used by some codecs.

**Returns**: `Buffer`

##### `CodecParameters.profile`

Codec-specific bitstream restrictions that the stream conforms to.

**Returns**: `number`

##### `CodecParameters.level`

Codec-specific bitstream restrictions that the stream conforms to.

**Returns**: `number`

##### `CodecParameters.format`

Video: the pixel format, the value corresponds to AVPixelFormat.
Audio: the sample format, the value corresponds to AVSampleFormat.

**Returns**: `number`

##### `CodecParameters.nbChannels`

Number of channels in the layout.

**Returns**: `number`

##### `CodecParameters.channelLayout`

Gets or sets the channel layout, see `ffmpeg.constants.channelLayouts`

**Returns**: `ChannelLayout`

##### `CodecParameters.blockAlign`

Audio only. The number of bytes per coded audio frame, required by some
formats.

Corresponds to `nBlockAlign` in `WAVEFORMATEX`.

**Returns**: `number`

##### `CodecParameters.initalPadding`

Audio only. The amount of padding (in samples) inserted by the encoder at the beginning of the audio. I.e. this number of leading decoded samples must be discarded by the caller to get the original audio without leading padding.

**Returns**: `number`

##### `CodecParameters.trailingPadding`

Audio only. The amount of padding (in samples) appended by the encoder to the end of the audio. I.e. this number of decoded samples must be discarded by the caller from the end of the stream to get the original audio without any trailing padding.

##### `CodecParameters.seekPreroll`

Audio only. Number of samples to skip after a discontinuity.

**Returns**: `number`

##### `CodecParameters.sampleAspectRatio`

Video only. The aspect ratio (width / height) which a single pixel should have when displayed.

When the aspect ratio is unknown / undefined, the numerator should be set to 0 (the denominator may have any value).

**Returns**: `number`

##### `CodecParameters.videoDelay`

Video only. Number of delayed frames.

**Returns**: `number`

#### Methods

##### `CodecParameters.fromContext(context)`

Copies parameters from a codec context.

Parameters:

- `context` (`CodecContext`): The codec context

**Returns**: `void`

##### `CodecParameters.toContext(context)`

Copies parameters to a codec context.

Parameters:

- `context` (`CodecContext`): The codec context

**Returns**: `void`

### `InputFormat`

The `InputFormat` API provides functionality to specify input format for media sources.

```js
const format = new ffmpeg.InputFormat([name])
```

Parameters:

- `name` (`string`, optional): The input format name. Defaults to a platform-specific value:
  - `darwin`, `ios`: ``'avfoundation'`
  - `linux`: `'v4l2'`
  - `win32`: `'dshow'`

**Returns**: A new `InputFormat` instance

#### Methods

##### `InputFormat.destroy()`

Destroys the `InputFormat` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `OutputFormat`

The `OutputFormat` API provides functionality to specify output format for media files.

```js
const format = new ffmpeg.OutputFormat(name)
```

Parameters:

- `name` (`string`): The output format name (e.g., `'mp4'`, `'avi'`, `'mov'`)

**Returns**: A new `OutputFormat` instance

#### Methods

##### `OutputFormat.destroy()`

Destroys the `OutputFormat` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `Frame`

This structure describes decoded (raw) audio or video data.

```js
const frame = new ffmpeg.Frame()
```

**Returns**: A new `Frame` instance

#### Properties

##### `Frame.width`

Gets or sets the frame width.

**Returns**: `number`

##### `Frame.height`

Gets or sets the frame height.

**Returns**: `number`

##### `Frame.format`

Gets or sets the format of the frame, `-1` if unknown or unset.

**Returns**: `number` (sample format constant)

##### `Frame.channelLayout`

Gets or sets the channel layout for audio frames.

**Returns**: `number` (channel layout constant)

##### `Frame.nbSamples`

Gets or sets the number of audio samples.

**Returns**: `number`

#### Methods

##### `Frame.alloc()`

Allocates memory for the frame data.

**Returns**: `void`

##### `Frame.destroy()`

Destroys the `Frame` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `Packet`

This structure stores compressed data. It is typically exported by demuxers and then passed as input to decoders, or received as output from encoders and then passed to muxers.

```js
const packet = new ffmpeg.Packet([buffer])
```

Parameters:

- `buffer` (`Buffer`, optional): Initial packet data

**Returns**: A new `Packet` instance

#### Properties

##### `Packet.data`

Gets the packet data buffer.

**Returns**: `Buffer`

##### `Packet.streamIndex`

Gets the stream index this packet belongs to.

**Returns**: `number`

#### Methods

##### `Packet.unref()`

Decrements the reference count and unreferences the packet.

**Returns**: `void`

##### `Packet.destroy()`

Destroys the `Packet` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `Image`

The `Image` API provides functionality to create and manage image buffers.

```js
const image = new ffmpeg.Image(pixelFormat, width, height[, align])
```

Parameters:

- `pixelFormat` (`number` | `string`): The pixel format
- `width` (`number`): The image width in pixels
- `height` (`number`): The image height in pixels
- `align` (`number`, optional): Memory alignment. Defaults to 1

**Returns**: A new `Image` instance

#### Properties

##### `Image.pixelFormat`

Gets the pixel format.

**Returns**: `number`

##### `Image.width`

Gets the image width.

**Returns**: `number`

##### `Image.height`

Gets the image height.

**Returns**: `number`

##### `Image.align`

Gets the memory alignment.

**Returns**: `number`

##### `Image.data`

Gets the image data buffer.

**Returns**: `Buffer`

#### Methods

##### `Image.fill(frame)`

Fills a frame with the image data.

Parameters:

- `frame` (`Frame`): The frame to fill

**Returns**: void

##### `Image.read(frame)`

Reads image data from a frame into the image buffer.

Parameters:

- `frame` (`Frame`): The frame to read from

**Returns**: `void`

##### `Image.lineSize([plane])`

Gets the line size for a specific plane.

Parameters:

- `plane` (`number`, optional): Plane index. Defaults to 0

**Returns**: `number`

#### Static methods

##### `Image.lineSize(pixelFormat, width[, plane])`

Static method to get line size for a pixel format.

Parameters:

- `pixelFormat` (`number` | `string`): The pixel format
- `width` (`number`): The image width
- `plane` (`number`, optional): Plane index. Defaults to 0

**Returns**: `number`

### `Rational`

The `Rational` API provides functionality to represent rational numbers (fractions).

```js
const rational = new ffmpeg.Rational(numerator, denominator)
```

Parameters:

- `numerator` (`number`): The numerator
- `denominator` (`number`): The denominator

**Returns**: A new `Rational` instance

#### Properties

##### `Rational.numerator`

Gets the numerator.

**Returns**: `number`

##### `Rational.denominator`

Gets the denominator.

**Returns**: `number`

##### `Rational.valid`

Returns if true if rational describes a non-zero & non-negative quantity.

**Returns**: `number`

##### `Rational.uninitialized`

Returns if true when is not set.

**Returns**: `number`

##### `Rational.toNumber()`

see `av_q2d()`

**Returns**: `number`

##### `static Rational.from(number)`

see `av_d2q()`

**Returns**: `Rational`

##### `Rational.rescaleQ(number, timebaseA, timebaseB)`

see `av_rescale_q()`

**Returns**: `number`

### `Stream`

The `Stream` API provides functionality to access media stream information and create decoders/encoders.

```js
const stream = new ffmpeg.Stream(handle)
```

Parameters:

- `handle` (`ArrayBuffer`): Internal stream handle

**Returns**: A new `Stream` instance

> Streams are typically obtained from format contexts: `const stream = format.streams[0]`

#### Properties

##### `Stream.id`

Gets or sets the stream ID.

**Returns**: `number`

##### `Stream.index`

Gets the stream index.

**Returns**: `number`

##### `Stream.codec`

Gets the codec for this stream.

**Returns**: `Codec` instance

##### `Stream.codecParameters`

Gets the codec parameters for this stream.

**Returns**: `CodecParameters` instance

##### `Stream.timeBase`

Gets or sets the time base for the stream.

**Returns**: `Rational` instance

##### `Stream.avgFramerate`

Gets or sets the average framerate for video streams.

**Returns**: `Rational` instance

Example:

```js
const fps = stream.avgFramerate.toNumber()
```

#### Methods

##### `Stream.decoder()`

Creates and opens a decoder for this stream.

**Returns**: `CodecContext` instance

##### `Stream.encoder()`

Creates and opens an encoder for this stream.

**Returns**: `CodecContext` instance

### `Resampler`

The `Resampler` API provides functionality to convert audio between different sample rates, channel layouts, and sample formats.

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

Parameters:

- `inputSampleRate` (`number`): Input sample rate in Hz
- `inputChannelLayout` (`number`): Input channel layout constant
- `inputSampleFormat` (`number`): Input sample format constant
- `outputSampleRate` (`number`): Output sample rate in Hz
- `outputChannelLayout` (`number`): Output channel layout constant
- `outputSampleFormat` (`number`): Output sample format constant

**Returns**: A new `Resampler` instance

#### Properties

##### `Resampler.inputSampleRate`

Gets the input sample rate.

**Returns**: `number`

##### `Resampler.outputSampleRate`

Gets the output sample rate.

**Returns**: `number`

##### `Resampler.delay`

Gets the resampler delay in samples.

**Returns**: `number`

#### Methods

##### `Resampler.convert(inputFrame, outputFrame)`

Converts audio data from input frame to output frame.

Parameters:

- `inputFrame` (`Frame`): The input audio frame
- `outputFrame` (`Frame`): The output audio frame

**Returns**: `number` of samples converted

##### `Resampler.flush(outputFrame)`

Flushes any remaining samples in the resampler.

Parameters:

- `outputFrame` (`Frame`): The output audio frame

**Returns**: `number` of samples flushed

##### `Resampler.destroy()`

Destroys the `Resampler` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `Scaler`

The `Scaler` API provides functionality to scale and convert video frames between different pixel formats and resolutions.

```js
const scaler = new ffmpeg.Scaler(
  sourcePixelFormat,
  sourceWidth,
  sourceHeight,
  targetPixelFormat,
  targetWidth,
  targetHeight
)
```

Parameters:

- `sourcePixelFormat` (`number` | `string`): Source pixel format
- `sourceWidth` (`number`): Source width in pixels
- `sourceHeight` (`number`): Source height in pixels
- `targetPixelFormat` (`number` | `string`): Target pixel format
- `targetWidth` (`number`): Target width in pixels
- `targetHeight` (`number`): Target height in pixels

**Returns**: A new `Scaler` instance

#### Methods

##### `Scaler.scale(source, target)`

Scales a source frame to a target frame.

Parameters:

- `source` (`Frame`): The source frame
- `target` (`Frame`): The target frame

**Returns**: `boolean` indicating success

##### `Scaler.scale(source, y, height, target)`

Scales a portion of a source frame to a target frame.

Parameters:

- `source` (`Frame`): The source frame
- `y` (`number`): Starting Y coordinate
- `height` (`number`): Height to scale
- `target` (`Frame`): The target frame

**Returns**: `boolean` indicating success

##### `Scaler.destroy()`

Destroys the `Scaler` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `AudioFIFO`

The `AudioFIFO` API provides a first in first out buffer for audio samples. This is useful for buffering audio data between different processing stages.

```js
const fifo = new ffmpeg.AudioFIFO(sampleFormat, channels, nbSamples)
```

Parameters:

- `sampleFormat` (`number` | `string`): The audio sample format
- `channels` (`number`): Number of audio channels
- `nbSamples` (`number`): Initial buffer size in samples

**Returns**: A new `AudioFIFO` instance

Example:

```js
const fifo = new ffmpeg.AudioFIFO(ffmpeg.constants.sampleFormats.S16, 2, 1024)
```

#### Properties

##### `AudioFIFO.size`

Gets the number of samples currently in the FIFO.

**Returns**: `number`

##### `AudioFIFO.space`

Gets the number of samples that can be written to the FIFO.

**Returns**: `number`

#### Methods

##### `AudioFIFO.write(frame)`

Writes samples from a frame to the FIFO. The FIFO will automatically grow if needed.

Parameters:

- `frame` (`Frame`): The audio frame containing samples to write

**Returns**: `number` of samples written

##### `AudioFIFO.read(frame, nbSamples)`

Reads samples from the FIFO into a frame.

Parameters:

- `frame` (`Frame`): The frame to read samples into
- `nbSamples` (`number`): Number of samples to read

**Returns**: `number` of samples actually read

##### `AudioFIFO.peek(frame, nbSamples)`

Reads samples from the FIFO without removing them.

Parameters:

- `frame` (`Frame`): The frame to read samples into
- `nbSamples` (`number`): Number of samples to peek

**Returns**: `number` of samples peeked

##### `AudioFIFO.drain(nbSamples)`

Removes samples from the FIFO without reading them.

Parameters:

- `nbSamples` (`number`): Number of samples to drain

**Returns**: `void`

##### `AudioFIFO.reset()`

Resets the FIFO to empty state.

**Returns**: `void`

##### `AudioFIFO.destroy()`

Destroys the `AudioFIFO` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

## License

Apache-2.0
