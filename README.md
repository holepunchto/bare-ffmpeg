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

> The IOContext instance is reference counted. Use `.ref()` to increment the reference count and `.unref()` to decrement it. The context will be automatically destroyed when the reference count reaches zero.

Example:

```javascript
const image = require('./fixtures/image/sample.jpeg', {
  with: { type: 'binary' }
})
const io = new ffmpeg.IOContext(image)
io.ref() // Increment reference count
// ... use io context ...
io.unref() // Decrement reference count
// Context will be destroyed when reference count reaches zero
```

### InputFormatContext

The InputFormatContext API provides functionality to read media files and extract streams.

```javascript
const format = new ffmpeg.InputFormatContext(io, options[, url])
```

Parameters:

- `io` (IOContext | InputFormat): The IO context or input format
- `options` (Dictionary): Format options. Required when using InputFormat, ignored when using IOContext
- `url` (string, optional): Media source URL. Defaults to platform-specific default

**Returns**: A new `InputFormatContext` instance

> The format context instance is reference counted. Use `.ref()` to increment the reference count and `.unref()` to decrement it.

#### Properties

##### `InputFormatContext.io`

Gets the IO context associated with this format context.

**Returns**: `IOContext` instance or null

##### `InputFormatContext.streams`

Gets the array of media streams.

**Returns**: Array of `Stream` instances

#### Methods

##### `InputFormatContext.readFrame(packet)`

Reads the next frame from the media file into a packet.

Parameters:

- `packet` (Packet): The packet to store the frame data

**Returns**: boolean indicating if a frame was read

##### `InputFormatContext.getBestStream(type)`

Gets the best stream of the specified media type.

Parameters:

- `type` (number): The media type from `ffmpeg.constants.mediaTypes`

**Returns**: `Stream` instance or null if not found

### OutputFormatContext

The OutputFormatContext API provides functionality to write media files.

```javascript
const format = new ffmpeg.OutputFormatContext(formatName, io)
```

Parameters:

- `formatName` (string): The output format name (e.g., 'mp4', 'avi')
- `io` (IOContext): The IO context for writing

**Returns**: A new `OutputFormatContext` instance

> The format context instance is reference counted. Use `.ref()` to increment the reference count and `.unref()` to decrement it.

#### Properties

##### `OutputFormatContext.io`

Gets the IO context associated with this format context.

**Returns**: `IOContext` instance

##### `OutputFormatContext.streams`

Gets the array of media streams.

**Returns**: Array of `Stream` instances

#### Methods

##### `OutputFormatContext.createStream(codec)`

Creates a new stream in the output format.

Parameters:

- `codec` (Codec): The codec to use for the stream

**Returns**: A new `Stream` instance

## License

Apache-2.0
