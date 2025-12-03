# Filter

The `Filter` API provides access to FFmpeg filters by name.

## Constructor

```js
const filter = new ffmpeg.Filter(name)
```

### Parameters

- `name` (`string`): The filter name (e.g., `'scale'`, `'buffer'`, `'overlay'`)

**Returns**: A new `Filter` instance

## Example

```js
const filter = new ffmpeg.Filter('buffer')
```
