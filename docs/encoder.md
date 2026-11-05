# Encoder

The `Encoder` class provides access to FFmpeg encoders for encoding media. Encoders can be found either by codec name (string) or by `Codec` object.

## Constructor

### `new Encoder(codec)`

Creates an encoder instance.

**Parameters:**

- `codec` (`string` | `Codec`): Either a codec name string (e.g., `'libsvtav1'`, `'libopus'`) or a `Codec` object (e.g., `ffmpeg.Codec.AV1`)

**Returns**: `Encoder` instance

**Throws**: Error if the encoder is not found

**Examples:**

```javascript
// Find encoder by name
const encoder = new ffmpeg.Encoder('libsvtav1')

// Find encoder by Codec object
const encoder2 = new ffmpeg.Encoder(ffmpeg.Codec.VP9)
```

## Available Encoders

Encoder names available in this build:

- `'libsvtav1'` - AV1 video encoder
- `'libopus'` - OPUS audio encoder
- `'libvpx'` - VP8 video encoder
- `'libvpx-vp9'` - VP9 video encoder

## Properties

### `Encoder.hwConfigs`

The hardware configurations the encoder supports, one per entry, each with:

- `pixelFormat` (`number`): The hardware pixel format, from `constants.pixelFormats`, or `NONE` when the method needs none
- `methods` (`number`): How the hardware is handed over, a mask of `constants.hwConfigMethods`
- `deviceType` (`number`): The device type, from `constants.hwDeviceTypes`

Empty for a software-only encoder.

**Type**: `Array<object>` (read-only)

```js
const configs = new ffmpeg.Encoder('h264_videotoolbox').hwConfigs
```

## See Also

- [Decoder](decoder.md) - Decoder class for decoding media
- [Codec](codec.md) - Codec information and properties
- [CodecContext](codec-context.md) - Main encoding/decoding interface
