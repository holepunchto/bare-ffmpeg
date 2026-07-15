# SideData

The `SideData` API provides functionality to handle side data associated with packets. Side data contains additional metadata that may be useful for specific codecs or processing.

## Constructor

```js
const sideData = new ffmpeg.Packet.SideData(handle, options)
```

### Parameters

- `handle` (`ArrayBuffer`): Internal side data handle
- `options` (`object`, optional): Configuration options
  - `type` (`number`): The side data type
  - `data` (`Buffer`): The side data buffer

**Returns**: A new `SideData` instance

## Static Methods

### `SideData.fromData(data, type)`

Creates a new `SideData` instance from data and type.

**Parameters:**

- `data` (`Buffer`): The side data buffer
- `type` (`number`): The side data type constant

**Returns**: A new `SideData` instance

## Properties

### `SideData.type`

Gets the side data type.

**Returns**: `number`

### `SideData.name`

Gets the human-readable name of the side data type.

**Returns**: `string`

### `SideData.data`

Gets the side data buffer.

**Returns**: `Buffer`

## Example

```js
const packet = new ffmpeg.Packet()
const sideData = ffmpeg.Packet.SideData.fromData(
  Buffer.from('metadata'),
  ffmpeg.constants.packetSideDataType.NEW_EXTRADATA
)
packet.sideData = [sideData]
```
