# FilterContext

The `FilterContext` API represents a filter instance within a filter graph. Filter contexts are created and managed by the `FilterGraph` class.

## Constructor

```js
const context = new ffmpeg.FilterContext()
```

**Returns**: A new `FilterContext` instance

> **Note**: FilterContext instances are typically created and configured through `FilterGraph.createFilter()` rather than being used directly.
