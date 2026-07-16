# Constants

The `constants` module provides utility functions for working with FFmpeg format constants and conversions.

## Hardware Frame Map Flags

The `hwFrameMapFlags` constants define how hardware frames are mapped to software memory:

- `NONE` (0): No flags (default)
- `READ` (1): Map for read-only access (most common use case)
- `WRITE` (2): Map for write access
- `OVERWRITE` (4): Overwrite any existing mapping
- `DIRECT` (8): Direct mapping without intermediate buffers

**Example:**

```js
// Map hardware frame for reading
hwFrame.hwMap(swFrame, ffmpeg.constants.hwFrameMapFlags.READ)

// Combined flags (bitwise OR)
hwFrame.hwMap(
  swFrame,
  ffmpeg.constants.hwFrameMapFlags.READ | ffmpeg.constants.hwFrameMapFlags.DIRECT
)
```

**Note**: These flags are used with `Frame.hwMap()` to control how hardware frames are mapped to software frames without performing full data copies.

## Methods

### `ffmpeg.constants.toPixelFormat(format)`

Converts a pixel format string or number to its corresponding constant value.

**Parameters:**

- `format` (`string` | `number`): The pixel format name (e.g., `'RGB24'`, `'YUV420P'`) or constant value

**Returns**: `number` - The pixel format constant

**Throws**: Error if the format is unknown or invalid type

**Example:**

```js
const format = ffmpeg.constants.toPixelFormat('RGB24')
console.log(format) // Outputs the RGB24 constant value
```

### `ffmpeg.constants.toSampleFormat(format)`

Converts a sample format string or number to its corresponding constant value.

**Parameters:**

- `format` (`string` | `number`): The sample format name (e.g., `'S16'`, `'FLTP'`) or constant value

**Returns**: `number` - The sample format constant

**Throws**: Error if the format is unknown or invalid type

**Example:**

```js
const format = ffmpeg.constants.toSampleFormat('S16')
console.log(format) // Outputs the S16 constant value
```

### `ffmpeg.constants.toChannelLayout(layout)`

Converts a channel layout string or number to its corresponding constant value.

**Parameters:**

- `layout` (`string` | `number`): The channel layout name (e.g., `'STEREO'`, `'5.1'`) or constant value

**Returns**: `number` - The channel layout constant

**Throws**: Error if the layout is unknown or invalid type

**Example:**

```js
const layout = ffmpeg.constants.toChannelLayout('STEREO')
console.log(layout) // Outputs the STEREO constant value
```

### `ffmpeg.constants.getSampleFormatName(sampleFormat)`

Gets the human-readable name of a sample format from its constant value.

**Parameters:**

- `sampleFormat` (`number`): The sample format constant

**Returns**: `string` - The sample format name

**Example:**

```js
const name = ffmpeg.constants.getSampleFormatName(ffmpeg.constants.sampleFormats.S16)
console.log(name) // 's16'
```

### `ffmpeg.constants.getPixelFormatName(pixelFormat)`

Gets the human-readable name of a pixel format from its constant value.

**Parameters:**

- `pixelFormat` (`number`): The pixel format constant

**Returns**: `string` - The pixel format name

**Example:**

```js
const name = ffmpeg.constants.getPixelFormatName(ffmpeg.constants.pixelFormats.RGB24)
console.log(name) // 'rgb24'
```

## Available Constant Groups

The `constants` module includes the following groups of constants:

- `pixelFormats`: Video pixel format constants (e.g., `RGB24`, `YUV420P`, `NV12`)
- `sampleFormats`: Audio sample format constants (e.g., `S16`, `FLTP`, `S32`)
- `channelLayouts`: Audio channel layout constants (e.g., `MONO`, `STEREO`, `5POINT1`)
- `mediaTypes`: Media type constants (e.g., `VIDEO`, `AUDIO`, `SUBTITLE`)
- `codecIds`: Codec identifier constants
- `hwDeviceTypes`: Hardware device type constants (e.g., `VIDEOTOOLBOX`, `VAAPI`)
- `hwFrameMapFlags`: Hardware frame mapping flags
- `seek`: Seek mode constants
- `codecConfig`: Codec configuration type constants
- `optionFlags`: Option search flag constants
- `packetSideDataType`: Packet side data type constants
