# Scaler

The `Scaler` API provides functionality to scale and convert video frames between different pixel formats and resolutions.

## Constructor

```js
const scaler = new ffmpeg.Scaler(
  sourcePixelFormat,
  sourceWidth,
  sourceHeight,
  targetPixelFormat,
  targetWidth,
  targetHeight
)
```

### Parameters

- `sourcePixelFormat` (`number` | `string`): Source pixel format
- `sourceWidth` (`number`): Source width in pixels
- `sourceHeight` (`number`): Source height in pixels
- `targetPixelFormat` (`number` | `string`): Target pixel format
- `targetWidth` (`number`): Target width in pixels
- `targetHeight` (`number`): Target height in pixels

**Returns**: A new `Scaler` instance

## Methods

### `Scaler.scale(source, target)`

Scales a source frame to a target frame.

**Parameters:**

- `source` (`Frame`): The source frame
- `target` (`Frame`): The target frame

**Returns**: `boolean` indicating success

### `Scaler.scale(source, y, height, target)`

Scales a portion of a source frame to a target frame.

**Parameters:**

- `source` (`Frame`): The source frame
- `y` (`number`): Starting Y coordinate
- `height` (`number`): Height to scale
- `target` (`Frame`): The target frame

**Returns**: `boolean` indicating success

### `Scaler.destroy()`

Destroys the `Scaler` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
