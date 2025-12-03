# Dictionary

The `Dictionary` API provides functionality to store and retrieve key-value pairs, commonly used for passing options to various FFmpeg components.

## Constructor

```js
const dict = new ffmpeg.Dictionary()
```

**Returns**: A new `Dictionary` instance

## Example

```js
const dict = new ffmpeg.Dictionary()
dict.set('video_codec', 'h264')
dict.set('audio_codec', 'aac')
dict.set('bitrate', '1000k')
```

## Methods

### `Dictionary.set(key, value)`

Sets a key-value pair in the dictionary. Non-string values are automatically converted to strings.

**Parameters:**

- `key` (`string`): The dictionary key
- `value` (`string` | `number`): The value to store

**Returns**: `void`

### `Dictionary.get(key)`

Retrieves a value from the dictionary by key.

**Parameters:**

- `key` (`string`): The dictionary key

**Returns**: `string` value or `null` if the key doesn't exist

### `Dictionary.entries()`

Retrieves all keys and values.

**Returns**: `Array<[string, string]>` value

### `Dictionary.destroy()`

Destroys the `Dictionary` and frees all associated resources. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`

## Iteration

The `Dictionary` class implements the iterator protocol, allowing you to iterate over all key-value pairs:

```js
const dict = new ffmpeg.Dictionary()
dict.set('foo', 'bar')
dict.set('baz', 'qux')

for (const [key, value] of dict) {
  console.log(`${key}: ${value}`)
}
```

## Static Methods

### `Dictionary.from(object)`

A helper to create a `Dictionary` instance from an object.

```js
const dict = ffmpeg.Dictionary.from({
  foo: 'bar',
  baz: 'qux'
})
```

**Returns**: A new `Dictionary` instance
