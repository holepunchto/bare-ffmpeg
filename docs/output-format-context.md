# OutputFormatContext

The `OutputFormatContext` API extends `FormatContext` to provide functionality for writing media files.

## Constructor

```js
const format = new ffmpeg.OutputFormatContext(formatName, io)
```

### Parameters

- `formatName` (`string`): The output format name (e.g., `'mp4'`, `'avi'`)
- `io` (`IOContext`): The IO context for writing. Ownership is automatically transferred to the format context, making the original IOContext safe to destroy multiple times.

**Returns**: A new `OutputFormatContext` instance

## Properties

### `OutputFormatContext.outputFormat`

Gets the output format associated with this context.

**Returns**: `OutputFormat` instance or `undefined` if not available

## Methods

### `OutputFormatContext.createStream(codec)`

Creates a new stream in the output format.

**Parameters:**

- `codec` (`Codec`): The codec to use for the stream

**Returns**: A new `Stream` instance

### `OutputFormatContext.writeHeader([options])`

Writes the container header. Call once after the streams are created and before writing packets.

**Parameters:**

- `options` (`Dictionary`, optional): Format options

**Returns**: `void`

**Throws**: Error if FFmpeg rejects the header

### `OutputFormatContext.writeFrame(packet)`

Writes a packet to the output, interleaved by `dts` across streams, see `av_interleaved_write_frame()`.

**Parameters:**

- `packet` (`Packet`): The packet to write

**Returns**: `void`

**Throws**: Error if the write fails

### `OutputFormatContext.writeTrailer()`

Flushes the buffered packets and writes the container trailer. Call once after the last `writeFrame()`.

**Returns**: `void`

**Throws**: Error if the write fails

### `OutputFormatContext.dump(printIdx, printUrl)`

Prints the format and stream information to the FFmpeg log at `INFO` level, see `av_dump_format()`.

**Parameters:**

- `printIdx` (`number`, optional): Index printed in the header. Defaults to `0`
- `printUrl` (`string`, optional): URL printed in the header. Defaults to `''`

**Returns**: `void`

### `OutputFormatContext.destroy()`

Destroys the `OutputFormatContext` and closes the output format. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
