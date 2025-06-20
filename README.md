# bare-ffmpeg

Low-level FFmpeg bindings for Bare.

```
npm i bare-ffmpeg
```

## Documentation

### IOContext

The IOContext API provides functionality to create input/output contexts for media files.

```javascript
const io = new ffmpeg.IOContext(buffer)
```

Parameters:

- `buffer` (Buffer): The media data buffer

**Returns**: A new `IOContext` instance

Example:

```javascript
const image = require('./fixtures/image/sample.jpeg', {
  with: { type: 'binary' }
})
const io = new ffmpeg.IOContext(image)
io.destroy()
```

#### Methods

##### `IOContext.destroy()`

Destroys the IOContext and frees all associated resources.

**Returns**: void

### FormatContext

The FormatContext API provides the base functionality for reading and writing media files.

> This is the base class that `InputFormatContext` and `OutputFormatContext` extend.

#### Properties

##### `FormatContext.io`

Gets the IO context associated with this format context.

**Returns**: `IOContext` instance or null

##### `FormatContext.streams`

Gets the array of media streams.

**Returns**: Array of `Stream` instances

#### Methods

##### `FormatContext.readFrame(packet)`

Reads the next frame from the media file into a packet.

Parameters:

- `packet` (Packet): The packet to store the frame data

**Returns**: boolean indicating if a frame was read

##### `FormatContext.getBestStream(type)`

Gets the best stream of the specified media type.

Parameters:

- `type` (number): The media type from `ffmpeg.constants.mediaTypes`

**Returns**: `Stream` instance or null if not found

##### `FormatContext.destroy()`

Destroys the FormatContext and frees all associated resources including streams.

**Returns**: void

### InputFormatContext

The InputFormatContext API extends `FormatContext` to provide functionality for reading media files.

```javascript
const format = new ffmpeg.InputFormatContext(io, options[, url])
```

Parameters:

- `io` (IOContext | InputFormat): The IO context or input format. The ownership of `io` is transferred, meaning you don't have to call the `destroy` method.
- `options` (Dictionary): Format options. Required when using InputFormat, ignored when using IOContext. The ownership of `options` is transferred.
- `url` (string, optional): Media source URL. Defaults to platform-specific default

**Returns**: A new `InputFormatContext` instance

#### Methods

##### `InputFormatContext.destroy()`

Destroys the InputFormatContext and closes the input format.

**Returns**: void

### OutputFormatContext

The OutputFormatContext API extends `FormatContext` to provide functionality for writing media files.

```javascript
const format = new ffmpeg.OutputFormatContext(formatName, io)
```

Parameters:

- `formatName` (string): The output format name (e.g., 'mp4', 'avi')
- `io` (IOContext): The IO context for writing. The ownership of `io` is transferred, meaning you don't have to call the `destroy` method.

**Returns**: A new `OutputFormatContext` instance

#### Methods

##### `OutputFormatContext.createStream(codec)`

Creates a new stream in the output format.

Parameters:

- `codec` (Codec): The codec to use for the stream

**Returns**: A new `Stream` instance

##### `OutputFormatContext.destroy()`

Destroys the OutputFormatContext and closes the output format.

**Returns**: void

### Codec

The Codec API provides access to FFmpeg codecs for encoding and decoding.

#### Static Properties

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

**Returns**: number

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

- `id` (number): The codec ID

**Returns**: `Codec` instance

### CodecContext

The CodecContext API provides functionality to encode or decode media frames.

```javascript
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

**Returns**: number (pixel format constant)

##### `CodecContext.width`

Gets or sets the frame width for video codecs.

**Returns**: number

##### `CodecContext.height`

Gets or sets the frame height for video codecs.

**Returns**: number

#### Methods

##### `CodecContext.open([options])`

Opens the codec context for encoding/decoding.

Parameters:

- `options` (Dictionary, optional): Codec-specific options

**Returns**: `CodecContext` instance (for chaining)

##### `CodecContext.sendFrame(frame)`

Sends a frame to the encoder.

Parameters:

- `frame` (Frame): The frame to encode

**Returns**: boolean indicating if the frame was accepted

##### `CodecContext.receiveFrame(frame)`

Receives a decoded frame from the decoder.

Parameters:

- `frame` (Frame): The frame to store the decoded data

**Returns**: boolean indicating if a frame was received

##### `CodecContext.sendPacket(packet)`

Sends a packet to the decoder.

Parameters:

- `packet` (Packet): The packet to decode

**Returns**: `CodecContext` instance (for chaining)

##### `CodecContext.receivePacket(packet)`

Receives an encoded packet from the encoder.

Parameters:

- `packet` (Packet): The packet to store the encoded data

**Returns**: boolean indicating if a packet was received

##### `CodecContext.destroy()`

Destroys the CodecContext and frees all associated resources.

**Returns**: void

### CodecParameters

The CodecParameters API provides functionality to access codec parameters from streams.

```javascript
const params = stream.codecParameters // Get from stream
```

#### Properties

##### `CodecParameters.bitRate`

Gets the bit rate.

**Returns**: number

##### `CodecParameters.bitsPerCodedSample`

Gets the bits per coded sample.

**Returns**: number

##### `CodecParameters.bitsPerRawSample`

Gets the bits per raw sample.

**Returns**: number

##### `CodecParameters.sampleRate`

Gets the sample rate for audio codecs.

**Returns**: number

#### Methods

##### `CodecParameters.fromContext(context)`

Copies parameters from a codec context.

Parameters:

- `context` (CodecContext): The codec context

**Returns**: void

##### `CodecParameters.toContext(context)`

Copies parameters to a codec context.

Parameters:

- `context` (CodecContext): The codec context

**Returns**: void

##### `CodecParameters.destroy()`

Destroys the CodecParameters and frees all associated resources.

**Returns**: void

### InputFormat

The InputFormat API provides functionality to specify input format for media sources.

```javascript
const format = new ffmpeg.InputFormat([name])
```

Parameters:

- `name` (string, optional): The input format name. Defaults to platform-specific default:
  - `darwin`: 'avfoundation'
  - `linux`: 'v4l2'
  - `win32`: 'dshow'

**Returns**: A new `InputFormat` instance

#### Methods

##### `InputFormat.destroy()`

Destroys the InputFormat and frees all associated resources.

**Returns**: void

### OutputFormat

The OutputFormat API provides functionality to specify output format for media files.

```javascript
const format = new ffmpeg.OutputFormat(name)
```

Parameters:

- `name` (string): The output format name (e.g., 'mp4', 'avi', 'mov')

**Returns**: A new `OutputFormat` instance

#### Methods

##### `OutputFormat.destroy()`

Destroys the OutputFormat and frees all associated resources.

**Returns**: void

### Frame

This structure describes decoded (raw) audio or video data.

```javascript
const frame = new ffmpeg.Frame()
```

**Returns**: A new `Frame` instance

#### Properties

##### `Frame.width`

Gets or sets the frame width.

**Returns**: number

##### `Frame.height`

Gets or sets the frame height.

**Returns**: number

##### `Frame.pixelFormat`

Gets or sets the pixel format.

**Returns**: number (pixel format constant)

##### `Frame.format`

Gets or sets the sample format for audio frames.

**Returns**: number (sample format constant)

##### `Frame.channelLayout`

Gets or sets the channel layout for audio frames.

**Returns**: number (channel layout constant)

##### `Frame.nbSamples`

Gets or sets the number of audio samples.

**Returns**: number

#### Methods

##### `Frame.alloc()`

Allocates memory for the frame data.

**Returns**: void

##### `Frame.destroy()`

Destroys the Frame and frees all associated resources.

**Returns**: void

### Packet

This structure stores compressed data. It is typically exported by demuxers and then passed as input to decoders, or received as output from encoders and then passed to muxers.

```javascript
const packet = new ffmpeg.Packet([buffer])
```

Parameters:

- `buffer` (Buffer, optional): Initial packet data

**Returns**: A new `Packet` instance

#### Properties

##### `Packet.data`

Gets the packet data buffer.

**Returns**: Buffer

##### `Packet.streamIndex`

Gets the stream index this packet belongs to.

**Returns**: number

#### Methods

##### `Packet.unref()`

Decrements the reference count and unreferences the packet.

**Returns**: void

##### `Packet.destroy()`

Destroys the Packet and frees all associated resources.

**Returns**: void

### Image

The Image API provides functionality to create and manage image buffers.

```javascript
const image = new ffmpeg.Image(pixelFormat, width, height[, align])
```

Parameters:

- `pixelFormat` (number | string): The pixel format
- `width` (number): The image width in pixels
- `height` (number): The image height in pixels
- `align` (number, optional): Memory alignment. Defaults to 1

**Returns**: A new `Image` instance

#### Properties

##### `Image.pixelFormat`

Gets the pixel format.

**Returns**: number

##### `Image.width`

Gets the image width.

**Returns**: number

##### `Image.height`

Gets the image height.

**Returns**: number

##### `Image.align`

Gets the memory alignment.

**Returns**: number

##### `Image.data`

Gets the image data buffer.

**Returns**: Buffer

#### Methods

##### `Image.fill(frame)`

Fills a frame with the image data.

Parameters:

- `frame` (Frame): The frame to fill

**Returns**: void

##### `Image.lineSize([plane])`

Gets the line size for a specific plane.

Parameters:

- `plane` (number, optional): Plane index. Defaults to 0

**Returns**: number

##### `Image.lineSize(pixelFormat, width[, plane])`

Static method to get line size for a pixel format.

Parameters:

- `pixelFormat` (number | string): The pixel format
- `width` (number): The image width
- `plane` (number, optional): Plane index. Defaults to 0

**Returns**: number

## License

Apache-2.0
