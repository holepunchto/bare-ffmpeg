# ChannelLayout

The `ChannelLayout` API describes how the channels of an audio stream are arranged, such as mono, stereo or 5.1. Audio frames, codec contexts and resamplers take and return one.

## Static Methods

### `ChannelLayout.from(value)`

Makes a layout from a name, a channel mask or another layout.

**Parameters:**

- `value` (`string` | `number` | `ChannelLayout`): A name from `constants.channelLayouts`, such as `'STEREO'` or `'5.1'`, a channel mask, or a layout to copy

**Returns**: A new `ChannelLayout` instance

**Throws**: Error if the name is unknown

```js
const stereo = ffmpeg.ChannelLayout.from('STEREO')
const surround = ffmpeg.ChannelLayout.from(ffmpeg.constants.channelLayouts['5.1'])
const copy = ffmpeg.ChannelLayout.from(frame.channelLayout)
```

## Properties

### `ChannelLayout.nbChannels`

The number of channels.

**Returns**: `number`

### `ChannelLayout.mask`

The channel mask, one bit per channel position.

**Returns**: `number`

## Example

```js
const frame = new ffmpeg.Frame()
frame.channelLayout = ffmpeg.ChannelLayout.from('STEREO')

console.log(frame.channelLayout.nbChannels) // 2
```
