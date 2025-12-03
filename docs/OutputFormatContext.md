# OutputFormatContext

The `OutputFormatContext` API extends `FormatContext` to provide functionality for writing media files.

## Constructor

```js
const format = new ffmpeg.OutputFormatContext(formatName, io)
```

### Parameters

- `formatName` (`string`): The output format name (e.g., `'mp4'`, `'avi'`)
- `io` (`IOContext`): The IO context for writing. The ownership of `io` is transferred.

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

### `OutputFormatContext.destroy()`

Destroys the `OutputFormatContext` and closes the output format. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
