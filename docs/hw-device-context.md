# HWDeviceContext

> [!IMPORTANT]
> This feature is experimental. The API is subject to change, and everything may break.

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

### `HWDeviceContext.types()`

Lists the hardware device types this build of FFmpeg supports.

**Returns**: `number[]` - Values from `constants.hwDeviceTypes`

## Methods

### `HWDeviceContext.destroy()`

Destroys the `HWDeviceContext` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

## Usage

Decoding on the GPU takes three steps, the same on every platform: create a device, hand it to the decoder, and pick the hardware pixel format when the decoder asks. The frames then come out in GPU memory, with `frame.hwFramesCtx` set, and `frame.transferData()` copies one into a software frame when the pixels are needed on the CPU.

```js
using hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)

const decoder = stream.decoder()
decoder.hwDeviceCtx = hwDevice
decoder.getFormat = (context, formats) => {
  const hwFormat = ffmpeg.constants.pixelFormats.VIDEOTOOLBOX

  return formats.includes(hwFormat) ? hwFormat : formats[0]
}
decoder.open()

using frame = new ffmpeg.Frame()
using swFrame = new ffmpeg.Frame()

while (decoder.receiveFrame(frame)) {
  swFrame.format = ffmpeg.constants.pixelFormats.NV12
  frame.transferData(swFrame)
}
```

Returning `formats[0]` when the hardware format is missing falls back to software decoding instead of failing.

Encoding on the GPU is a matter of picking the right encoder by name. Which device types, pixel formats and encoders exist depends on the platform.

### macOS and iOS

VideoToolbox, `hwDeviceTypes.VIDEOTOOLBOX`, takes no device name and decodes into `pixelFormats.VIDEOTOOLBOX`. The encoders are `h264_videotoolbox`, `hevc_videotoolbox` and `prores_videotoolbox`, and they take software frames directly, no device needed:

```js
const encoder = new ffmpeg.Encoder('h264_videotoolbox')
```

### Linux

Two device types. VAAPI, `hwDeviceTypes.VAAPI`, takes the render node as device, `/dev/dri/renderD128` unless the machine has several GPUs, and decodes into `pixelFormats.VAAPI`. Vulkan, `hwDeviceTypes.VULKAN`, takes no device name and decodes into `pixelFormats.VULKAN`. Both need something from the system, see below.

The VAAPI encoders, `h264_vaapi` and `hevc_vaapi`, only accept frames already in GPU memory: create an `HWFramesContext` on the device, set it as `frame.hwFramesCtx`, and upload with `transferData()` from a software frame.

#### VAAPI

A VAAPI device, `hwDeviceTypes.VAAPI`, is available on Linux. The addon ships `libva`, but the driver comes from the system: `intel-media-driver` for Intel GPUs, `mesa-va-drivers` for AMD. `libva` looks for it in `/usr/lib/x86_64-linux-gnu/dri`, `/usr/lib/aarch64-linux-gnu/dri`, `/usr/lib64/dri` and `/usr/lib/dri`; `LIBVA_DRIVERS_PATH` overrides that list and `LIBVA_DRIVER_NAME` forces a single driver. The device, `/dev/dri/renderD128` by default, has to be readable by the process.

#### Vulkan

A Vulkan device, `hwDeviceTypes.VULKAN`, is available on Linux and Windows. The Vulkan loader is opened when the device is created, not when the module loads, so a machine without Vulkan is only affected if it asks for one.

The loader reads `VK_ICD_FILENAMES`, `VK_LAYER_PATH`, `VK_ADD_LAYER_PATH` and `VK_INSTANCE_LAYERS` from the environment and loads what they point to. Decoding with a Vulkan device also hands the bitstream to the GPU driver. Only create one in a process whose environment and input you trust.

Decoding needs a driver that exposes `VK_KHR_video_decode_queue`. Some distributions ship Mesa without the video codecs, and on some Intel GPUs Mesa only exposes them with `ANV_DEBUG=video-decode` set in the environment.

### Windows

Three device types, none of which takes a device name. Direct3D 11, `hwDeviceTypes.D3D11VA`, decodes into `pixelFormats.D3D11`. DXVA2, `hwDeviceTypes.DXVA2`, decodes into `pixelFormats.DXVA2_VLD`. Vulkan, `hwDeviceTypes.VULKAN`, decodes into `pixelFormats.VULKAN`, needs a GPU driver that provides `vulkan-1.dll`, and the notes on the Vulkan loader above apply here too. The Direct3D and Vulkan libraries are loaded when the device is created, so a machine without a GPU driver still loads the module and only the device fails.

The encoders come from Media Foundation, `h264_mf`, `hevc_mf` and `aac_mf`, and take software frames directly, no device needed.

### Android

MediaCodec is used through the `*_mediacodec` codecs, such as `h264_mediacodec`. They take and return software frames, so no device is needed.
