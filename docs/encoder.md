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

## See Also

- [Decoder](decoder.md) - Decoder class for decoding media
- [Codec](codec.md) - Codec information and properties
- [CodecContext](codec-context.md) - Main encoding/decoding interface
