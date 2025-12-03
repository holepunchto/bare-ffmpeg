# Image

The `Image` API provides functionality to create and manage image buffers.

## Constructor

```js
const image = new ffmpeg.Image(pixelFormat, width, height[, align])
```

### Parameters

- `pixelFormat` (`number` | `string`): The pixel format
- `width` (`number`): The image width in pixels
- `height` (`number`): The image height in pixels
- `align` (`number`, optional): Memory alignment. Defaults to 1

**Returns**: A new `Image` instance

## Properties

### `Image.pixelFormat`

Gets the pixel format.

**Returns**: `number`

### `Image.width`

Gets the image width.

**Returns**: `number`

### `Image.height`

Gets the image height.

**Returns**: `number`

### `Image.align`

Gets the memory alignment.

**Returns**: `number`

### `Image.data`

Gets the image data buffer.

**Returns**: `Buffer`

## Methods

### `Image.fill(frame)`

Fills a frame with the image data.

**Parameters:**

- `frame` (`Frame`): The frame to fill

**Returns**: void

### `Image.read(frame)`

Reads image data from a frame into the image buffer.

**Parameters:**

- `frame` (`Frame`): The frame to read from

**Returns**: `void`

### `Image.lineSize([plane])`

Gets the line size for a specific plane.

**Parameters:**

- `plane` (`number`, optional): Plane index. Defaults to 0

**Returns**: `number`

## Static Methods

### `Image.lineSize(pixelFormat, width[, plane])`

Static method to get line size for a pixel format.

**Parameters:**

- `pixelFormat` (`number` | `string`): The pixel format
- `width` (`number`): The image width
- `plane` (`number`, optional): Plane index. Defaults to 0

**Returns**: `number`
