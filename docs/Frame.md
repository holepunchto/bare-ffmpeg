# Frame

This structure describes decoded (raw) audio or video data.

## Constructor

```js
const frame = new ffmpeg.Frame()
```

**Returns**: A new `Frame` instance

## Properties

### `Frame.width`

Gets or sets the frame width.

**Returns**: `number`

### `Frame.height`

Gets or sets the frame height.

**Returns**: `number`

### `Frame.format`

Gets or sets the format of the frame, `-1` if unknown or unset.

**Returns**: `number` (sample format constant)

### `Frame.channelLayout`

Gets or sets the channel layout for audio frames.

**Returns**: `number` (channel layout constant)

### `Frame.nbSamples`

Gets or sets the number of audio samples.

**Returns**: `number`

### `Frame.hwFramesCtx`

Gets or sets the hardware frames context (`HWFramesContext`) for this frame. This property is automatically set by FFmpeg when decoding with hardware acceleration. It can also be set manually when preparing frames for hardware encoding.

```js
// Example for macOS and iOS
const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
const decoder = stream.decoder()
decoder.hwDeviceCtx = hwDevice

const hwFrame = new ffmpeg.Frame()
decoder.receiveFrame(hwFrame)

if (hwFrame.hwFramesCtx) {
  console.log('Frame has hardware context')
  console.log('Format:', hwFrame.hwFramesCtx.format)
  console.log('Dimensions:', hwFrame.hwFramesCtx.width, 'x', hwFrame.hwFramesCtx.height)
}
```

**Returns**: `HWFramesContext | null`

## Methods

### `Frame.alloc()`

Allocates memory for the frame data.

**Returns**: `void`

### `Frame.destroy()`

Destroys the `Frame` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

### `Frame.copyProperties(otherFrame)`

Copies all metadata properties such as timestamps, timebase and width/height for videoframes and
sampleRate channelLayout for audioFrames.

see `av_frame_copy_props()` for details.

```js
const src = new ffmpeg.Frame()
const dst = new ffmpeg.Frame()

decoder.receiveFrame(src)
rescaler.convert(src, dst)

dst.copyProperties(src) // transfer all meta-data
```

**Returns**: `void`

### `Frame.transferData(destinationFrame)`

Transfers frame data between hardware and software memory. This is used when working with hardware-accelerated decoding/encoding to copy frame data from hardware memory (GPU) to software memory (CPU) or vice versa.

```js
const hwDevice = new ffmpeg.HWDeviceContext(ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX)
const decoder = new ffmpeg.CodecContext(ffmpeg.Codec.H264.decoder)
decoder.hwDeviceCtx = hwDevice

const hwFrame = new ffmpeg.Frame()
decoder.receiveFrame(hwFrame)

const swFrame = new ffmpeg.Frame()
swFrame.format = ffmpeg.constants.pixelFormats.NV12
hwFrame.transferData(swFrame)
```

**Note**: This method only works with frames that have hardware contexts. Calling it on regular software frames will throw an error.

**Returns**: `void`

### `Frame.hwMap(destination, flags)`

Maps a hardware frame to a software frame without performing a full data copy. This is more efficient than `transferData()` when you only need read-only access to the hardware frame data.

```js
// Map hardware frame for reading
const hwFrame = new ffmpeg.Frame() // from hardware decoder
const swFrame = new ffmpeg.Frame()

hwFrame.hwMap(swFrame, ffmpeg.constants.hwFrameMapFlags.READ)
// swFrame now has read-only access to hwFrame data
console.log('Dimensions:', swFrame.width, 'x', swFrame.height)
```

**Parameters:**

- `destination` (`Frame`): The software frame to map into
- `flags` (`number`, optional): Mapping flags (defaults to `0`). Use `ffmpeg.constants.hwFrameMapFlags`:
  - `READ`: Map for reading (most common)
  - `WRITE`: Map for writing
  - `OVERWRITE`: Overwrite existing mapping
  - `DIRECT`: Direct mapping without intermediate buffers

**Note**: This method only works with hardware frames. The destination frame should not be allocated beforehand - the mapping will set up its buffers.

**Returns**: `void`
