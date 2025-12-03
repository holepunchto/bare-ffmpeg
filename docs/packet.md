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

### `Packet.isKeyFrame`

Get or set the key frame flag.

**Returns**: `boolean`

### `Packet.sideData`

Gets or sets the side data associated with the packet.

**Returns**: `Array<SideData>`

## Methods

### `Packet.unref()`

Decrements the reference count and unreferences the packet.

**Returns**: `void`

### `Packet.destroy()`

Destroys the `Packet` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
