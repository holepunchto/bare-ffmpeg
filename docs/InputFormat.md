# InputFormat

The `InputFormat` API provides functionality to specify input format for media sources.

## Constructor

```js
const format = new ffmpeg.InputFormat([name])
```

### Parameters

- `name` (`string`, optional): The input format name. Defaults to a platform-specific value:
  - `darwin`, `ios`: `'avfoundation'`
  - `linux`: `'v4l2'`
  - `win32`: `'dshow'`

**Returns**: A new `InputFormat` instance

## Properties

### `InputFormat.extensions`

Gets the file extensions associated with this input format.

**Returns**: `string` - Comma-separated list of file extensions (e.g., `'mkv,mk3d,mka,mks,webm'`)

### `InputFormat.mimeType`

Gets the MIME type for this input format.

**Returns**: `string` - The MIME type (e.g., `'audio/webm,audio/x-matroska,video/webm,video/x-matroska'`)

### `InputFormat.name`

Returns format name

**Returns**: `string` - The short-name (e.g., `webm`)

## Example

```js
const format = new ffmpeg.InputFormat('webm')
console.log(format.extensions) // 'mkv,mk3d,mka,mks,webm'
console.log(format.mimeType) // 'audio/webm,audio/x-matroska,video/webm,video/x-matroska'
```

## Methods

### `InputFormat.destroy()`

Destroys the `InputFormat` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
