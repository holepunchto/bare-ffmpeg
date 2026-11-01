# OutputFormat

The `OutputFormat` API provides functionality to specify output format for media files.

## Constructor

```js
const format = new ffmpeg.OutputFormat(name)
```

### Parameters

- `name` (`string`): The output format name (e.g., `'mp4'`, `'avi'`, `'mov'`)

**Returns**: A new `OutputFormat` instance

**Throws**: Error if `name` isn't a string or no output format has that name

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

## Static Methods

### `OutputFormat.listDevices(name)`

Lists the output devices of a device format.

**Parameters:**

- `name` (`string`): The device format name (e.g., `'fbdev'`)

**Returns**: `Array<object>` - One entry per device, with:

- `name` (`string`): The device name to pass when opening the device
- `description` (`string`): A human friendly name
- `default` (`boolean`): Whether this is the default device
- `mediaTypes` (`Array<number>`): Media types the device provides (see `constants.mediaTypes`)

**Throws**: Error if `name` isn't a valid format name or the format can't list devices. On macOS and iOS, `audiotoolbox` can't.

```js
const devices = ffmpeg.OutputFormat.listDevices('fbdev')
```

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
