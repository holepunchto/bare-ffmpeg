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

**Throws**: Error if `name` isn't a string or no input format has that name

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

## Static Methods

### `InputFormat.listDevices([name])`

Lists the input devices of a device format.

**Parameters:**

- `name` (`string`, optional): The device format name (e.g., `'dshow'`, `'v4l2'`). Defaults to the same platform-specific value as the constructor.

**Returns**: `Array<object>` - One entry per device, with:

- `name` (`string`): The device name to pass when opening the device
- `description` (`string`): A human friendly name
- `default` (`boolean`): Whether this is the default device
- `mediaTypes` (`Array<number>`): Media types the device provides (see `constants.mediaTypes`)

**Throws**: Error if `name` isn't a valid format name or the format can't list devices. On macOS and iOS, `avfoundation` can't.

```js
const devices = ffmpeg.InputFormat.listDevices('dshow')
```

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
