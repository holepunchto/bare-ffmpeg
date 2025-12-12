# FilterInOut

> [!IMPORTANT]
> This feature is experimental. The API is subject to change, and everything may break.

The `FilterInOut` API represents an input or output pad of a filter graph.

## Constructor

```js
const filterInOut = new ffmpeg.FilterInOut()
```

**Returns**: A new `FilterInOut` instance

> **Note**: FilterInOut objects form a linked list structure in FFmpeg. When destroying a FilterInOut that has a `next` reference, the entire chain is automatically freed. Only destroy the head of the chain to avoid double-free errors.

## Properties

### `FilterInOut.name`

Gets or sets the name identifier for this input/output pad.

**Returns**: `string` or `undefined` if not set

**Example:**

```js
const filterInOut = new ffmpeg.FilterInOut()
filterInOut.name = 'input'
console.log(filterInOut.name) // 'input'
```

### `FilterInOut.padIdx`

Gets or sets the pad index within the filter context.

**Returns**: `number`

**Example:**

```js
filterInOut.padIdx = 0
console.log(filterInOut.padIdx) // 0
```

### `FilterInOut.filterContext`

Gets or sets the filter context associated with this input/output pad.

**Returns**: `FilterContext` instance or `null` if not set

> **Note**: FilterContext must be created through FilterGraph operations before it can be used effectively.

### `FilterInOut.next`

Gets or sets the next FilterInOut in the linked list chain.

**Returns**: `FilterInOut` instance or `null` if this is the last in the chain

**Example:**

```js
const input = new ffmpeg.FilterInOut()
const output = new ffmpeg.FilterInOut()
output.name = 'output'

input.next = output
console.log(input.next.name) // 'output'
```

## Methods

### `FilterInOut.destroy()`

Destroys the `FilterInOut` and frees all associated resources. **Important**: This automatically frees the entire linked list chain via FFmpeg's `avfilter_inout_free()`.

**Returns**: `void`

**Example:**

```js
const head = new ffmpeg.FilterInOut()
const next = new ffmpeg.FilterInOut()
head.next = next

// Only destroy the head - 'next' is automatically freed
head.destroy()
// DO NOT call next.destroy() - causes double-free error
```
