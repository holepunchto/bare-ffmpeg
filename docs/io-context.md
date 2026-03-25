# IOContext

The `IOContext` API provides functionality to create input/output contexts for media files with support for streaming and custom I/O operations.

## Constructor

```js
const io = new ffmpeg.IOContext(buffer[, options])
```

### Parameters

- `buffer` (`Buffer` | `number`): The media data buffer or buffer size for streaming
- `options` (`object`, optional): Configuration options
  - `onread` (`function`): A function for refilling the buffer.
  - `onwrite` (`function`): A function for writing the buffer contents.
  - `onseek` (`function`): A function for seeking to specified byte position.

**Returns**: A new `IOContext` instance

## Constructor Options

### `onread(buffer, requestedLen)`

Callback function called when FFmpeg needs to read data. For streaming scenarios where data is not available in a single buffer.

**Parameters:**

- `buffer` (`Buffer`): Buffer to fill with data
- `requestedLen` (`number`): Number of bytes requested

**Returns**: `number` - Number of bytes actually read, or 0 for EOF

### `onwrite(buffer)`

Callback function called when FFmpeg needs to write data. For streaming output scenarios.

**Parameters:**

- `buffer` (`Buffer`): Buffer containing data to write

**Returns**: `number` - Number of bytes written

### `onseek(offset, whence)`

Callback function called when FFmpeg needs to seek within the data source.

**Parameters:**

- `offset` (`number`): Offset to seek to
- `whence` (`number`): Seek mode (see `ffmpeg.constants.seek`)

**Returns**: `number` - New position or file size for `AVSEEK_SIZE`

## Examples

### Basic usage with buffer

```js
const image = require('./fixtures/image/sample.jpeg', {
  with: { type: 'binary' }
})
using io = new ffmpeg.IOContext(image)
```

### Streaming with custom read callback

```js
const io = new ffmpeg.IOContext(4096, {
  onread: (buffer) => {
    const bytesToRead = Math.min(buffer.length, data.length - offset)
    if (bytesToRead === 0) return 0

    const chunk = data.subarray(offset, offset + bytesToRead)
    buffer.set(chunk)
    offset += bytesToRead
    return bytesToRead
  }
})
```

### Streaming with seek support

```js
const io = new ffmpeg.IOContext(4096, {
  onread: (buffer) => {
    // ... read implementation
  },
  onseek: (offset, whence) => {
    switch (whence) {
      case ffmpeg.constants.seek.SIZE:
        return data.length
      case ffmpeg.constants.seek.SET:
        offset = offset
        return offset
      default:
        return -1
    }
  }
})
```

## Methods

### `IOContext.destroy()`

Destroys the `IOContext` and frees all associated resources. Automatically called when the object is managed by a `using` declaration. Safe to call multiple times - becomes a no-op after the native handle is transferred.

**Returns**: `void`

### `IOContext.transfer()`

Creates a new IOContext and transfers ownership from this IOContext to the new instance. After transfer, this IOContext becomes inactive while the returned IOContext has full ownership. This enables safe ownership transfer between objects.

**Returns**: `IOContext` - A new IOContext instance with transferred ownership

**Example:**

```js
const sourceIO = new ffmpeg.IOContext(buffer)
const targetIO = sourceIO.transfer()
// sourceIO is now safe to destroy, targetIO has full ownership
```
