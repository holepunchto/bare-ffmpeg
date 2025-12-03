# HWDeviceContext

The `HWDeviceContext` API provides functionality to create and manage hardware device contexts for hardware-accelerated encoding and decoding.

## Constructor

```js
const hwDevice = new ffmpeg.HWDeviceContext(type[, device])
```

### Parameters

- `type` (`number`): The hardware device type from `ffmpeg.constants.hwDeviceTypes` (e.g., `VIDEOTOOLBOX`, `VAAPI`)
- `device` (`string`, optional): Device identifier. If not specified, uses the default device for the type.

**Returns**: A new `HWDeviceContext` instance

## Example

```js
// Create VideoToolbox hardware device context (macOS/iOS)
const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)

// Create VAAPI hardware device context with specific device (Linux)
const hwDevice = new ffmpeg.HWDeviceContext(
  ffmpeg.constants.hwDeviceTypes.VAAPI,
  '/dev/dri/renderD128'
)
```

## Static Methods

### `HWDeviceContext.from(handle)`

Creates a `HWDeviceContext` instance from an existing native handle. Used internally when retrieving hardware device contexts from other objects.

**Parameters:**

- `handle` (`ArrayBuffer`): Native handle to wrap

**Returns**: `HWDeviceContext` instance or `null` if handle is null

## Methods

### `HWDeviceContext.destroy()`

Destroys the `HWDeviceContext` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

## Usage

Hardware device contexts are typically used with `CodecContext` to enable hardware acceleration:

```js
const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
const decoder = new ffmpeg.CodecContext(ffmpeg.Codec.AV1.decoder)
decoder.hwDeviceCtx = hwDevice

// Configure getFormat callback to select hardware pixel format
decoder.getFormat = (ctx, formats) => {
  const hwFormat = formats.find((f) => f === ffmpeg.constants.pixelFormats.VIDEOTOOLBOX)
  return hwFormat ?? formats[0]
}

decoder.open()
// Decoding now uses hardware acceleration
```

## Supported Hardware Device Types

The available hardware device types depend on your FFmpeg build and platform:

- **macOS/iOS**: `VIDEOTOOLBOX`
- **Linux**: `VAAPI`, `VDPAU`, `DRM`
- **Windows**: `D3D11VA`, `DXVA2`
- **Cross-platform**: `CUDA`, `OPENCL`

Check `ffmpeg.constants.hwDeviceTypes` for the full list of available types.
