# Packet

This structure stores compressed data. It is typically exported by demuxers and then passed as input to decoders, or received as output from encoders and then passed to muxers.

## Constructor

```js
const packet = new ffmpeg.Packet([buffer])
```

### Parameters

- `buffer` (`Buffer`, optional): Initial packet data

**Returns**: A new `Packet` instance

## Properties

### `Packet.data`

Gets the packet data buffer.

**Returns**: `Buffer`

### `Packet.streamIndex`

Gets the stream index this packet belongs to.

**Returns**: `number`

### `Packet.pts`

Gets or sets the presentation timestamp in `timeBase` units, `-1` if unset.

**Returns**: `number`

### `Packet.dts`

Gets or sets the decompression timestamp in `timeBase` units, `-1` if unset.

**Returns**: `number`

### `Packet.duration`

Gets or sets the duration in `timeBase` units, `0` if unknown.

**Returns**: `number`

### `Packet.timeBase`

Gets or sets the time base of the packet timestamps.

**Returns**: `Rational` instance

### `Packet.flags`

Gets or sets the packet flags, a bitwise OR of `AV_PKT_FLAG_*` values.

**Returns**: `number`

### `Packet.isKeyFrame`

Get or set the key frame flag.

**Returns**: `boolean`

### `Packet.sideData`

Gets or sets the side data associated with the packet.

**Returns**: `Array<SideData>`

## Methods

### `Packet.rescaleTimestamps(srcTimeBase, dstTimeBase)`

Converts `pts`, `dts` and `duration` from `srcTimeBase` to `dstTimeBase`.

**Parameters:**

- `srcTimeBase` (`Rational`): The current time base of the timestamps
- `dstTimeBase` (`Rational`): The time base to convert to

**Returns**: `void`

### `Packet.copyPropsFrom(sourcePacket)`

Copies every field except the data from `sourcePacket`, see `av_packet_copy_props()`.

**Parameters:**

- `sourcePacket` (`Packet`): The packet to copy from

**Returns**: `void`

### `Packet.unref()`

Decrements the reference count and unreferences the packet.

**Returns**: `void`

### `Packet.destroy()`

Destroys the `Packet` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
