# Codec

The `Codec` API provides access to FFmpeg codecs for encoding and decoding.

## Static Properties

### `Codec.H264`

H.264 video codec.

**Returns**: `Codec` instance

### `Codec.MJPEG`

Motion JPEG video codec.

**Returns**: `Codec` instance

### `Codec.AAC`

AAC audio codec.

**Returns**: `Codec` instance

### `Codec.AV1`

AV1 video codec.

**Returns**: `Codec` instance

### `Codec.VP8`

VP8 video codec.

**Returns**: `Codec` instance

### `Codec.VP9`

VP9 video codec.

**Returns**: `Codec` instance

## Properties

### `Codec.id`

Gets the codec ID.

**Returns**: `number`

### `Codec.encoder`

Gets the encoder for this codec.

**Returns**: `Encoder` instance

### `Codec.decoder`

Gets the decoder for this codec.

**Returns**: `Decoder` instance

## Methods

### `Codec.for(id)`

Gets a codec by ID.

**Parameters:**

- `id` (`number`): The codec ID

**Returns**: `Codec` instance
