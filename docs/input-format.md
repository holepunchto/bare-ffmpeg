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

### `InputFormat.listDevices([name][, opts])`

Lists the input devices available for a device format, using `avdevice_list_input_sources`.

**Parameters:**

- `name` (`string`, optional): The device format name (e.g., `'dshow'`, `'v4l2'`, `'avfoundation'`). Defaults to the same platform-specific value as the constructor. Pass `undefined` to use the default with `opts`.
- `opts.mediaType` (`number`, optional): Only return devices that provide this media type (see `constants.mediaTypes`)

**Returns**: `Array<object>` - One entry per device, with:

- `name` (`string`): The device name to pass when opening the device
- `description` (`string`): A human friendly name
- `default` (`boolean`): Whether this is the default device
- `mediaTypes` (`Array<number>`): Media types the device provides (see `constants.mediaTypes`)

**Throws**: Error if `name` isn't a valid format name or the format can't list devices

`avfoundation` doesn't support `avdevice_list_input_sources`, so on macOS the devices are read from its `list_devices` output instead. Video devices, including screens, are named `'<index>'` and audio devices `':<index>'`, matching the `'video:audio'` syntax `avfoundation` uses to open devices. `default` is always `false`.

```js
const devices = ffmpeg.InputFormat.listDevices('dshow')

const microphones = ffmpeg.InputFormat.listDevices('dshow', {
  mediaType: ffmpeg.constants.mediaTypes.AUDIO
})
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
