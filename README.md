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

- `io` (IOContext | InputFormat): The IO context or input format
- `options` (Dictionary): Format options. Required when using InputFormat, ignored when using IOContext
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
- `io` (IOContext): The IO context for writing

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

## License

Apache-2.0
