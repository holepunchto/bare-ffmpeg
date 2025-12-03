# OutputFormat

The `OutputFormat` API provides functionality to specify output format for media files.

## Constructor

```js
const format = new ffmpeg.OutputFormat(name)
```

### Parameters

- `name` (`string`): The output format name (e.g., `'mp4'`, `'avi'`, `'mov'`)

**Returns**: A new `OutputFormat` instance

## Properties

### `OutputFormat.extensions`

Gets the file extensions associated with this output format.

**Returns**: `string` - Comma-separated list of file extensions (e.g., `'webm'`, `'mp4,m4a,m4v'`)

### `OutputFormat.mimeType`

Gets the MIME type for this output format.

**Returns**: `string` - The MIME type (e.g., `'video/webm'`, `'video/mp4'`)

### `OutputFormat.name`

Returns format name

**Returns**: `string` - The short-name (e.g., `webm`)

## Example

```js
const format = new ffmpeg.OutputFormat('webm')
console.log(format.extensions) // 'webm'
console.log(format.mimeType) // 'video/webm'
```

## Methods

### `OutputFormat.destroy()`

Destroys the `OutputFormat` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
