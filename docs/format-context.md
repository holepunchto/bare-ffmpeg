# FormatContext

The `FormatContext` API provides the base functionality for reading and writing media files.

> This is the base class that `InputFormatContext` and `OutputFormatContext` extend.

## Properties

### `FormatContext.io`

Gets the IO context associated with this format context.

**Returns**: `IOContext` instance or `null`

### `FormatContext.streams`

Gets the array of media streams.

**Returns**: Array of `Stream` instances

## Methods

### `FormatContext.readFrame(packet)`

Reads the next frame from the media file into a packet.

**Parameters:**

- `packet` (`Packet`): The packet to store the frame data

**Returns**: `boolean` indicating if a frame was read

### `FormatContext.getBestStream(type)`

Gets the best stream of the specified media type.

**Parameters:**

- `type` (`number`): The media type from `ffmpeg.constants.mediaTypes`

**Returns**: `Stream` instance or `null` if not found

### `FormatContext.destroy()`

Destroys the `FormatContext` and frees all associated resources including streams. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
