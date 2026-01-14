# Decoder

The `Decoder` class provides access to FFmpeg decoders for decoding media. Decoders can be found either by codec name (string) or by `Codec` object.

## Constructor

### `new Decoder(codec)`

Creates a decoder instance.

**Parameters:**

- `codec` (`string` | `Codec`): Either a codec name string (e.g., `'vp8'`, `'h264'`, `'libdav1d'`) or a `Codec` object (e.g., `ffmpeg.Codec.VP9`)

**Returns**: `Decoder` instance

**Throws**: Error if the decoder is not found

**Examples:**

```javascript
// Find decoder by name
const decoder = new ffmpeg.Decoder('h264')

// Find decoder by Codec object
const decoder2 = new ffmpeg.Decoder(ffmpeg.Codec.AV1)
```

## Available Decoders

Decoder names available in this build:

- `'vp8'` - VP8 video decoder
- `'vp9'` - VP9 video decoder
- `'h264'` - H.264 video decoder
- `'libdav1d'` - AV1 video decoder

## See Also

- [Encoder](encoder.md) - Encoder class for encoding media
- [Codec](codec.md) - Codec information and properties
- [CodecContext](codec-context.md) - Main encoding/decoding interface
