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

### `Frame.metadata`

Gets the frame metadata as a `FrameMetadata` accessor. Metadata is a set of key/value string pairs attached to the frame, for example values produced by filters such as `astats` or `metadata`.

```js
const metadata = frame.metadata

// Look up a single entry (returns null when the key is absent)
const peak = metadata.get('lavfi.astats.Overall.Peak_level')

// Iterate over every [key, value] entry
for (const [key, value] of metadata) {
  console.log(key, value)
}

// Or collect them all at once
const entries = metadata.entries()
```

**Returns**: `FrameMetadata`

### `Frame.sideData`

Gets or sets the side data associated with the frame. Setting replaces the current side data with the provided list.

```js
frame.sideData = [
  ffmpeg.Frame.SideData.fromData(
    Buffer.from([0, 1, 2, 3]),
    ffmpeg.constants.frameSideDataType.CONTENT_LIGHT_LEVEL
  )
]

for (const sideData of frame.sideData) {
  console.log(sideData.type, sideData.name, sideData.data)
}
```

**Returns**: `Array<Frame.SideData>`

## Static Properties

### `Frame.SideData`

The frame side data class. Use `Frame.SideData.fromData(data, type)` to build an entry for assignment to `Frame.sideData`.

**Parameters (`fromData`):**

- `data` (`Buffer`): The side data buffer
- `type` (`number`): A `ffmpeg.constants.frameSideDataType` constant

**Returns**: A new `Frame.SideData` instance with `type`, `name` and `data` accessors.

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

### `Frame.removeSideData(type)`

Removes all side data of the given type from the frame.

```js
frame.removeSideData(ffmpeg.constants.frameSideDataType.CONTENT_LIGHT_LEVEL)
```

**Parameters:**

- `type` (`number`): A `ffmpeg.constants.frameSideDataType` constant

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
