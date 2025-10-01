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
      case ffmpeg.constants.seek.SET:
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

##### `InputFormatContext.inputFormat`

Gets the input format associated with this context.

**Returns**: `InputFormat` instance or `undefined` if not available

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

##### `OutputFormatContext.outputFormat`

Gets the output format associated with this context.

**Returns**: `OutputFormat` instance or `undefined` if not available

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

##### `CodecContext.frameSize`

Gets the number of samples per channel in an audio frame.

**Returns**: `number`

##### `CodecContext.frameNum`

When encoding this gets the total number of frames passed to the encoder so far.

When decoding this gets the total number of frames returned from the decoder so far.

**Returns**: `number`

##### `CodecContext.requestSampleFormat`

_Only when decoding_

Set to before calling `context.open()` to hint decoder of preferred output format if supported.

Always rely on `CodecContext.sampleFormat` for actual decoded format.

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

##### `CodecContext.getSupportedConfig(config)`

Gets the supported values for a codec configuration option.

Parameters:

- `config` (`number`): The configuration type from `ffmpeg.constants.codecConfig`

**Returns**:

- For `PIX_FORMAT`, `SAMPLE_FORMAT`, `COLOR_RANGE`, `COLOR_SPACE`: `Int32Array` of supported values (all valid values are included if the codec has no restrictions)
- For `SAMPLE_RATE`: `Int32Array` of supported sample rates or `null` if the codec accepts any valid sample rate
- For `FRAME_RATE`: Array of `Rational` instances or `null` if the codec accepts any valid frame rate
- For `CHANNEL_LAYOUT`: Array of `ChannelLayout` instances or `null` if the codec accepts any valid channel layout

**Throws**: Error if the config type is not applicable to this codec (e.g., asking for pixel formats from an audio codec)

Examples:

```js
const codecCtx = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.encoder)

const pixelFormats = codecCtx.getSupportedConfig(
  ffmpeg.constants.codecConfig.PIX_FORMAT
)
if (pixelFormats) {
  console.log('Supported pixel formats:', pixelFormats)
}

const frameRates = codecCtx.getSupportedConfig(
  ffmpeg.constants.codecConfig.FRAME_RATE
)
if (frameRates) {
  frameRates.forEach((rate) => {
    console.log(`${rate.toNumber()} fps`)
  })
}

const layouts = codecCtx.getSupportedConfig(
  ffmpeg.constants.codecConfig.CHANNEL_LAYOUT
)
if (layouts) {
  console.log('Supported channel layouts:', layouts)
}
```

##### `CodecContext.getOption(name[, flags])`

Gets the value of a codec option.

Parameters:

- `name` (`string`): The option name (for example, `'threads'` or `'crf'`)
- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `string` value or `null` when the option is unset

##### `CodecContext.setOption(name, value[, flags])`

Sets a codec option.

Parameters:

- `name` (`string`): The option name to set
- `value` (`string`): The option value
- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `void`

##### `CodecContext.setOptionDictionary(dictionary[, flags])`

Sets options from a `Dictionary`. Ownership of the dictionary is retained by the caller.

Parameters:

- `dictionary` (`Dictionary`): Dictionary of option key/value pairs
- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `void`

##### `CodecContext.setOptionDefaults()`

Resets codec options to their defaults.

**Returns**: `void`

##### `CodecContext.listOptionNames([flags])`

Lists option names available on the codec context.

Parameters:

- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `Array<string>` of option names

##### `CodecContext.getOptions([flags])`

Collects option values into a plain object.

Parameters:

- `flags` (`number`, optional): Option search flags (default `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`)

**Returns**: `object` mapping option names to string values

##### `CodecContext.copyOptionsFrom(context)`

Copies options from another codec context.

Parameters:

- `context` (`CodecContext`): Source context whose options should be copied

**Returns**: `void`

Example:

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

#### Properties

##### `InputFormat.extensions`

Gets the file extensions associated with this input format.

**Returns**: `string` - Comma-separated list of file extensions (e.g., `'mkv,mk3d,mka,mks,webm'`)

##### `InputFormat.mimeType`

Gets the MIME type for this input format.

**Returns**: `string` - The MIME type (e.g., `'audio/webm,audio/x-matroska,video/webm,video/x-matroska'`)

#### Example

```js
const format = new ffmpeg.InputFormat('webm')
console.log(format.extensions) // 'mkv,mk3d,mka,mks,webm'
console.log(format.mimeType) // 'audio/webm,audio/x-matroska,video/webm,video/x-matroska'
```

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

#### Properties

##### `OutputFormat.extensions`

Gets the file extensions associated with this output format.

**Returns**: `string` - Comma-separated list of file extensions (e.g., `'webm'`, `'mp4,m4a,m4v'`)

##### `OutputFormat.mimeType`

Gets the MIME type for this output format.

**Returns**: `string` - The MIME type (e.g., `'video/webm'`, `'video/mp4'`)

#### Example

```js
const format = new ffmpeg.OutputFormat('webm')
console.log(format.extensions) // 'webm'
console.log(format.mimeType) // 'video/webm'
```

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

##### `Frame.copyProperties(otherFrame)`

Copies all metadata properties such as timestamps, timebase and width/height for videoframes and
sampleRate channelLayout for audioFrames.

see `av_frame_copy_props()` for details.

```js
const src = new ffmpeg.Frame()
const dst = new ffmpeg.Frame()

decoder.receiveFrame(src)
rescaler.convert(src, dst)

dst.copyProperties(src) // transfer all meta-data
```

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

##### `Packet.isKeyFrame`

Get or set the key frame flag.

**Returns**: `boolean`

##### `Packet.sideData`

Gets or sets the side data associated with the packet.

**Returns**: `Array<SideData>`

#### Methods

##### `Packet.unref()`

Decrements the reference count and unreferences the packet.

**Returns**: `void`

##### `Packet.destroy()`

Destroys the `Packet` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `SideData`

The `SideData` API provides functionality to handle side data associated with packets. Side data contains additional metadata that may be useful for specific codecs or processing.

```js
const sideData = new ffmpeg.Packet.SideData(handle, options)
```

Parameters:

- `handle` (`ArrayBuffer`): Internal side data handle
- `options` (`object`, optional): Configuration options
  - `type` (`number`): The side data type
  - `data` (`Buffer`): The side data buffer

**Returns**: A new `SideData` instance

#### Static Methods

##### `SideData.fromData(data, type)`

Creates a new `SideData` instance from data and type.

Parameters:

- `data` (`Buffer`): The side data buffer
- `type` (`number`): The side data type constant

**Returns**: A new `SideData` instance

#### Properties

##### `SideData.type`

Gets the side data type.

**Returns**: `number`

##### `SideData.name`

Gets the human-readable name of the side data type.

**Returns**: `string`

##### `SideData.data`

Gets the side data buffer.

**Returns**: `Buffer`

#### Example

```js
const packet = new ffmpeg.Packet()
const sideData = ffmpeg.Packet.SideData.fromData(
  Buffer.from('metadata'),
  ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
)
packet.sideData = [sideData]
```

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

### `Filter`

The `Filter` API provides access to FFmpeg filters by name.

```js
const filter = new ffmpeg.Filter(name)
```

Parameters:

- `name` (`string`): The filter name (e.g., `'scale'`, `'buffer'`, `'overlay'`)

**Returns**: A new `Filter` instance

#### Example

```js
const filter = new ffmpeg.Filter('buffer')
```

### `FilterGraph`

The `FilterGraph` API provides functionality to create and manage complex filter chains for audio and video processing.

```js
const graph = new ffmpeg.FilterGraph()
```

**Returns**: A new `FilterGraph` instance

#### Methods

##### `FilterGraph.createFilter(context, filter, name, args)`

Creates a filter within the filter graph with the specified parameters.

Parameters:

- `context` (`FilterContext`): The filter context to associate with this filter
- `filter` (`Filter`): The filter to create (e.g., `new ffmpeg.Filter('buffer')`)
- `name` (`string`): A unique name for this filter instance
- `args` (`object` | `undefined`): Filter-specific arguments
  - `width` (`number`): Video width in pixels
  - `height` (`number`): Video height in pixels
  - `pixelFormat` (`number`): Pixel format constant
  - `timeBase` (`Rational`): Time base for the filter
  - `aspectRatio` (`Rational`): Pixel aspect ratio

**Returns**: `void`

```js
using graph = new ffmpeg.FilterGraph()
const context = new ffmpeg.FilterContext()
const filter = new ffmpeg.Filter('buffer')

graph.createFilter(context, filter, 'in', {
  width: 1920,
  height: 1080,
  pixelFormat: ffmpeg.constants.pixelFormats.RGB24,
  timeBase: new ffmpeg.Rational(1, 30),
  aspectRatio: new ffmpeg.Rational(1, 1)
})
```

##### `FilterGraph.parse(filterDescription, inputs, outputs)`

Parses a filter description string and applies it to the filter graph.

Parameters:

- `filterDescription` (`string`): The filter description (e.g., `'negate'`, `'scale=640:480'`)
- `inputs` (`FilterInOut`): Input filter endpoints
- `outputs` (`FilterInOut`): Output filter endpoints

**Returns**: `void`

##### `FilterGraph.configure()`

Configures the filter graph and validates all connections.

**Returns**: `void`

##### `FilterGraph.destroy()`

Destroys the `FilterGraph` and frees all associated resources including any created filters. Automatically called when the object is managed by a `using` declaration.

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

### `FilterInOut`

The `FilterInOut` API provides functionality to represent input and output pads for FFmpeg filter graphs.

```js
const filterInOut = new ffmpeg.FilterInOut()
```

**Returns**: A new `FilterInOut` instance

> **Note**: FilterInOut objects form a linked list structure in FFmpeg. When destroying a FilterInOut that has a `next` reference, the entire chain is automatically freed. Only destroy the head of the chain to avoid double-free errors.

#### Properties

##### `FilterInOut.name`

Gets or sets the name identifier for this input/output pad.

**Returns**: `string` or `undefined` if not set

```js
const filterInOut = new ffmpeg.FilterInOut()
filterInOut.name = 'input'
console.log(filterInOut.name) // 'input'
```

##### `FilterInOut.padIdx`

Gets or sets the pad index within the filter context.

**Returns**: `number`

```js
filterInOut.padIdx = 0
console.log(filterInOut.padIdx) // 0
```

##### `FilterInOut.filterContext`

Gets or sets the filter context associated with this input/output pad.

**Returns**: `FilterContext` instance or `null` if not set

> **Note**: FilterContext must be created through FilterGraph operations before it can be used effectively.

##### `FilterInOut.next`

Gets or sets the next FilterInOut in the linked list chain.

**Returns**: `FilterInOut` instance or `null` if this is the last in the chain

```js
const input = new ffmpeg.FilterInOut()
const output = new ffmpeg.FilterInOut()
output.name = 'output'

input.next = output
console.log(input.next.name) // 'output'
```

#### Methods

##### `FilterInOut.destroy()`

Destroys the `FilterInOut` and frees all associated resources. **Important**: This automatically frees the entire linked list chain via FFmpeg's `avfilter_inout_free()`.

**Returns**: `void`

```js
const head = new ffmpeg.FilterInOut()
const next = new ffmpeg.FilterInOut()
head.next = next

// Only destroy the head - 'next' is automatically freed
head.destroy()
// DO NOT call next.destroy() - causes double-free error
```

### Constants and Utilities

The `constants` module provides utility functions for working with FFmpeg format constants and conversions.

#### Methods

##### `ffmpeg.constants.toPixelFormat(format)`

Converts a pixel format string or number to its corresponding constant value.

Parameters:

- `format` (`string` | `number`): The pixel format name (e.g., `'RGB24'`, `'YUV420P'`) or constant value

**Returns**: `number` - The pixel format constant

**Throws**: Error if the format is unknown or invalid type

```js
const format = ffmpeg.constants.toPixelFormat('RGB24')
console.log(format) // Outputs the RGB24 constant value
```

##### `ffmpeg.constants.toSampleFormat(format)`

Converts a sample format string or number to its corresponding constant value.

Parameters:

- `format` (`string` | `number`): The sample format name (e.g., `'S16'`, `'FLTP'`) or constant value

**Returns**: `number` - The sample format constant

**Throws**: Error if the format is unknown or invalid type

```js
const format = ffmpeg.constants.toSampleFormat('S16')
console.log(format) // Outputs the S16 constant value
```

##### `ffmpeg.constants.toChannelLayout(layout)`

Converts a channel layout string or number to its corresponding constant value.

Parameters:

- `layout` (`string` | `number`): The channel layout name (e.g., `'STEREO'`, `'5.1'`) or constant value

**Returns**: `number` - The channel layout constant

**Throws**: Error if the layout is unknown or invalid type

```js
const layout = ffmpeg.constants.toChannelLayout('STEREO')
console.log(layout) // Outputs the STEREO constant value
```

##### `ffmpeg.constants.getSampleFormatName(sampleFormat)`

Gets the human-readable name of a sample format from its constant value.

Parameters:

- `sampleFormat` (`number`): The sample format constant

**Returns**: `string` - The sample format name

```js
const name = ffmpeg.constants.getSampleFormatName(
  ffmpeg.constants.sampleFormats.S16
)
console.log(name) // 's16'
```

##### `ffmpeg.constants.getPixelFormatName(pixelFormat)`

Gets the human-readable name of a pixel format from its constant value.

Parameters:

- `pixelFormat` (`number`): The pixel format constant

**Returns**: `string` - The pixel format name

```js
const name = ffmpeg.constants.getPixelFormatName(
  ffmpeg.constants.pixelFormats.RGB24
)
console.log(name) // 'rgb24'
```

## License

Apache-2.0
