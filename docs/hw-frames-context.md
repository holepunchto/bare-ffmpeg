# HWFramesContext

The `HWFramesContext` API provides functionality to manage hardware frame pools for hardware-accelerated encoding and decoding. It handles the allocation and configuration of hardware frame buffers.

## Constructor

```js
const hwFramesCtx = new ffmpeg.HWFramesContext(hwDeviceContext, format, swFormat, width, height)
```

### Parameters

- `hwDeviceContext` (`HWDeviceContext`): The hardware device context to use
- `format` (`number`): Hardware pixel format (e.g., `ffmpeg.constants.pixelFormats.VIDEOTOOLBOX`)
- `swFormat` (`number`): Software pixel format for transfers (e.g., `ffmpeg.constants.pixelFormats.NV12`)
- `width` (`number`): Frame width in pixels
- `height` (`number`): Frame height in pixels

**Returns**: A new `HWFramesContext` instance

## Example

```js
const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
const hwFramesCtx = new ffmpeg.HWFramesContext(
  hwDevice,
  ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
  ffmpeg.constants.pixelFormats.NV12,
  1920,
  1080
)
```

## Static Methods

### `HWFramesContext.from(handle)`

Creates a `HWFramesContext` instance from an existing native handle. Used internally when retrieving hardware frames contexts from frames or codec contexts.

**Parameters:**

- `handle` (`ArrayBuffer`): Native handle to wrap

**Returns**: `HWFramesContext` instance or `null` if handle is null

## Properties

### `HWFramesContext.format`

Gets or sets the hardware pixel format.

**Returns**: `number`

### `HWFramesContext.swFormat`

Gets or sets the software pixel format for transfers.

**Returns**: `number`

### `HWFramesContext.width`

Gets or sets the frame width.

**Returns**: `number`

### `HWFramesContext.height`

Gets or sets the frame height.

**Returns**: `number`

### `HWFramesContext.initialPoolSize`

Gets or sets the initial pool size for hardware frame allocation. Setting this before using the context can improve performance by pre-allocating frames.

**Returns**: `number`

## Methods

### `HWFramesContext.getBuffer(frame)`

Allocates a hardware frame from the frame pool. The frame's hardware frames context is automatically set.

**Parameters:**

- `frame` (`Frame`): The frame to allocate hardware memory for

**Returns**: `void`

**Example:**

```js
const frame = new ffmpeg.Frame()
hwFramesCtx.getBuffer(frame) // Frame now has hardware-backed memory
```

### `HWFramesContext.getConstraints()`

Queries the hardware device for its capabilities and constraints. Returns information about supported formats, resolutions, and other limitations.

**Returns**: `HWFramesConstraints` instance

**Example:**

```js
const constraints = hwFramesCtx.getConstraints()
console.log('Supported software formats:', constraints.validSwFormats)
console.log('Supported hardware formats:', constraints.validHwFormats)
console.log('Min resolution:', constraints.minWidth, 'x', constraints.minHeight)
console.log('Max resolution:', constraints.maxWidth, 'x', constraints.maxHeight)
```

### `HWFramesContext.destroy()`

Destroys the `HWFramesContext` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

## Usage Example

Complete example showing hardware frame allocation and encoding:

```js
using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
using hwFramesCtx = new ffmpeg.HWFramesContext(
  hwDevice,
  ffmpeg.constants.pixelFormats.VIDEOTOOLBOX,
  ffmpeg.constants.pixelFormats.NV12,
  1920,
  1080
)

// Set initial pool size for better performance
hwFramesCtx.initialPoolSize = 10

// Create encoder and set hardware context
using encoder = new ffmpeg.CodecContext(ffmpeg.Codec.H264.encoder)
encoder.hwDeviceCtx = hwDevice

// Allocate hardware frame
using hwFrame = new ffmpeg.Frame()
hwFramesCtx.getBuffer(hwFrame)

// Transfer software frame to hardware
swFrame.transferData(hwFrame)

// Encode hardware frame
encoder.sendFrame(hwFrame)
```
