# InputFormatContext

The `InputFormatContext` API extends `FormatContext` to provide functionality for reading media files.

## Constructor

```js
const format = new ffmpeg.InputFormatContext(io, options[, url])
```

### Parameters

- `io` (`IOContext` | `InputFormat`): The IO context or input format. The ownership of `io` is transferred.
- `options` (`Dictionary`): Format options. Required when using `InputFormat`, ignored when using `IOContext`. The ownership of `options` is transferred.
- `url` (`string`, optional): Media source URL. Defaults to a platform-specific value

**Returns**: A new `InputFormatContext` instance

## Properties

### `InputFormatContext.inputFormat`

Gets the input format associated with this context.

**Returns**: `InputFormat` instance or `undefined` if not available

## Methods

### `InputFormatContext.destroy()`

Destroys the `InputFormatContext` and closes the input format. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
