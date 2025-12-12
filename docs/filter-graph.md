# FilterGraph

> [!IMPORTANT]
> This feature is experimental. The API is subject to change, and everything may break.

The `FilterGraph` API allows you to create and manage audio/video filter graphs.

## Constructor

```js
const graph = new ffmpeg.FilterGraph()
```

**Returns**: A new `FilterGraph` instance

## Methods

### `FilterGraph.createFilter(context, filter, name, args)`

Creates a filter within the filter graph with the specified parameters.

**Parameters:**

- `context` (`FilterContext`): The filter context to associate with this filter
- `filter` (`Filter`): The filter to create (e.g., `new ffmpeg.Filter('buffer')`)
- `name` (`string`): A unique name for this filter instance
- `args` (`object` | `undefined`): Filter-specific arguments
  - `width` (`number`): Video width in pixels
  - `height` (`number`): Video height in pixels
  - `pixelFormat` (`number`): Pixel format constant
  - `timeBase` (`Rational`): Time base for the filter
  - `aspectRatio` (`Rational`): Pixel aspect ratio

**Returns**: `void`

**Example:**

```js
using graph = new ffmpeg.FilterGraph()
const context = new ffmpeg.FilterContext()
const filter = new ffmpeg.Filter('buffer')

graph.createFilter(context, filter, 'in', {
  width: 1920,
  height: 1080,
  pixelFormat: ffmpeg.constants.pixelFormats.RGB24,
  timeBase: new ffmpeg.Rational(1, 30),
  aspectRatio: new ffmpeg.Rational(1, 1)
})
```

### `FilterGraph.parse(filterDescription, inputs, outputs)`

Parses a filter description string and applies it to the filter graph.

**Parameters:**

- `filterDescription` (`string`): The filter description (e.g., `'negate'`, `'scale=640:480'`)
- `inputs` (`FilterInOut`): Input filter endpoints
- `outputs` (`FilterInOut`): Output filter endpoints

**Returns**: `void`

### `FilterGraph.configure()`

Configures the filter graph and validates all connections.

**Returns**: `void`

### `FilterGraph.destroy()`

Destroys the `FilterGraph` and frees all associated resources including any created filters. Automatically called when the object is managed by a `using` declaration.

**Returns**: `void`
