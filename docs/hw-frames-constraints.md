# HWFramesConstraints

> [!IMPORTANT]
> This feature is experimental. The API is subject to change, and everything may break.

The `HWFramesConstraints` API provides information about hardware device capabilities and limitations. This is useful for determining what formats and resolutions are supported before allocating hardware frames.

## Constructor

```js
const constraints = new ffmpeg.HWFramesConstraints(handle)
```

### Parameters

- `handle` (`ArrayBuffer`): Internal constraints handle (created by FFmpeg)

**Returns**: A new `HWFramesConstraints` instance

> **Note**: `HWFramesConstraints` instances are typically obtained via `HWFramesContext.getConstraints()` rather than being constructed directly.

## Properties

### `HWFramesConstraints.validSwFormats`

Gets the list of supported software pixel formats for frame transfers.

**Returns**: `Int32Array` of pixel format constants

### `HWFramesConstraints.validHwFormats`

Gets the list of supported hardware pixel formats.

**Returns**: `Int32Array` of pixel format constants

### `HWFramesConstraints.minWidth`

Gets the minimum supported frame width.

**Returns**: `number`

### `HWFramesConstraints.maxWidth`

Gets the maximum supported frame width.

**Returns**: `number`

### `HWFramesConstraints.minHeight`

Gets the minimum supported frame height.

**Returns**: `number`

### `HWFramesConstraints.maxHeight`

Gets the maximum supported frame height.

**Returns**: `number`

## Methods

### `HWFramesConstraints.destroy()`

Destroys the `HWFramesConstraints` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

> **Important**: `HWFramesConstraints` is independently allocated by FFmpeg and must be explicitly freed. It is not automatically freed when the `HWFramesContext` is destroyed.

## Example

```js
using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
using hwFramesCtx = new ffmpeg.HWFramesContext(
  hwDevice,
  ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
  ffmpeg.constants.pixelFormats.NV12,
  1920,
  1080
)

using constraints = hwFramesCtx.getConstraints()

console.log('Hardware Constraints:')
console.log('Valid SW formats:', constraints.validSwFormats)
console.log('Valid HW formats:', constraints.validHwFormats)
console.log(
  'Resolution range:',
  constraints.minWidth,
  'x',
  constraints.minHeight,
  'to',
  constraints.maxWidth,
  'x',
  constraints.maxHeight
)

// Check if a specific software format is supported
const nv12Format = ffmpeg.constants.pixelFormats.NV12
const supportsNV12 = constraints.validSwFormats.includes(nv12Format)
console.log('Supports NV12:', supportsNV12)
```

## Usage

Use constraints to validate configuration before allocating hardware resources:

```js
using constraints = hwFramesCtx.getConstraints()

// Validate resolution
const width = 3840
const height = 2160
if (
  width >= constraints.minWidth &&
  width <= constraints.maxWidth &&
  height >= constraints.minHeight &&
  height <= constraints.maxHeight
) {
  console.log('Resolution is supported')
} else {
  console.log('Resolution is not supported by hardware')
}

// Find a compatible software format
const preferredFormats = [ffmpeg.constants.pixelFormats.NV12, ffmpeg.constants.pixelFormats.YUV420P]

const compatibleFormat = preferredFormats.find((fmt) => constraints.validSwFormats.includes(fmt))

if (compatibleFormat) {
  console.log('Using format:', ffmpeg.constants.getPixelFormatName(compatibleFormat))
}
```
