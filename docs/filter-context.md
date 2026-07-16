# FilterContext

> [!IMPORTANT]
> This feature is experimental. The API is subject to change, and everything may break.

The `FilterContext` API represents an instance of a filter in a filter graph.

## Constructor

```js
const context = new ffmpeg.FilterContext()
```

**Returns**: A new `FilterContext` instance

> **Note**: FilterContext instances are typically created and configured through `FilterGraph.createFilter()` rather than being used directly.

## Methods

All option helpers accept an optional `flags` argument that defaults to `ffmpeg.constants.optionFlags.SEARCH_CHILDREN`, so options declared on child objects (private contexts) are reachable.

### `FilterContext.getOption(name, flags?)`

Gets the current string value of an option by name.

```js
const volume = volumeCtx.getOption('volume')
```

**Parameters:**

- `name` (`string`): The option name
- `flags` (`number`, optional): Option search flags

**Returns**: `string`

### `FilterContext.setOption(name, value, flags?)`

Sets an option to the given value. Throws if the option is unknown.

```js
volumeCtx.setOption('volume', '0.5')
```

**Parameters:**

- `name` (`string`): The option name
- `value` (`string`): The option value
- `flags` (`number`, optional): Option search flags

**Returns**: `void`

### `FilterContext.setOptionDictionary(dictionary, flags?)`

Applies every entry of a `Dictionary` as options in one call.

```js
using options = ffmpeg.Dictionary.from({ volume: '0.25' })
volumeCtx.setOptionDictionary(options)
```

**Parameters:**

- `dictionary` (`Dictionary`): The options to apply
- `flags` (`number`, optional): Option search flags

**Returns**: `void`

### `FilterContext.setOptionDefaults()`

Resets every option to its default value, including options that live in the wrapped filter's private data (the same options reached via `SEARCH_CHILDREN`).

**Returns**: `void`

### `FilterContext.listOptionNames(flags?)`

Lists the names of all available options on the context.

**Parameters:**

- `flags` (`number`, optional): Option search flags

**Returns**: `Array<string>`

### `FilterContext.getOptions(flags?)`

Collects all string-valued options into a plain object. Non-string options are skipped, matching `CodecContext` behaviour.

```js
const options = volumeCtx.getOptions()
console.log(options.volume)
```

**Parameters:**

- `flags` (`number`, optional): Option search flags

**Returns**: `object`
