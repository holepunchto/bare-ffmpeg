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

## Properties

### `Decoder.hwConfigs`

The hardware configurations the decoder supports, one per entry, each with:

- `pixelFormat` (`number`): The hardware pixel format, from `constants.pixelFormats`, or `NONE` when the method needs none
- `methods` (`number`): How the hardware is handed over, a mask of `constants.hwConfigMethods`
- `deviceType` (`number`): The device type, from `constants.hwDeviceTypes`

Empty for a software-only decoder.

**Type**: `Array<object>` (read-only)

```js
const configs = new ffmpeg.Decoder('h264').hwConfigs

const videotoolbox = configs.find(
  (config) => config.deviceType === ffmpeg.constants.hwDeviceTypes.VIDEOTOOLBOX
)
```

## Methods

### `Decoder.getSupportedConfig(config)`

Gets the supported values for a codec configuration option, for the codec alone. `CodecContext.getSupportedConfig()` gives the answer for a configured context, which may be narrower.

**Parameters:**

- `config` (`number`): The configuration type from `ffmpeg.constants.codecConfig`

**Returns**:

- For `PIX_FORMAT`, `SAMPLE_FORMAT`, `COLOR_RANGE`, `COLOR_SPACE`: `Int32Array` of supported values
- For `SAMPLE_RATE`: `Int32Array` of supported sample rates, or `null` when the codec accepts any
- For `FRAME_RATE`: array of `Rational`, or `null` when the codec accepts any
- For `CHANNEL_LAYOUT`: array of `ChannelLayout`, or `null` when the codec accepts any

**Throws**: Error if the config type does not apply to this codec

```js
const formats = new ffmpeg.Decoder('h264').getSupportedConfig(
  ffmpeg.constants.codecConfig.PIX_FORMAT
)
```

## See Also

- [Encoder](encoder.md) - Encoder class for encoding media
- [Codec](codec.md) - Codec information and properties
- [CodecContext](codec-context.md) - Main encoding/decoding interface
