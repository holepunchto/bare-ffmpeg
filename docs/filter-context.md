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
