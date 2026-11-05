# log

The `log` API sets how much FFmpeg prints to standard error. The default is `ERROR`.

## Properties

### `log.level`

Gets or sets the level. Messages above it are dropped.

**Type**: `number`, one of the levels below

## Levels

In order, from silent to everything: `log.QUIET`, `log.PANIC`, `log.FATAL`, `log.ERROR`, `log.WARNING`, `log.INFO`, `log.VERBOSE`, `log.DEBUG`, `log.TRACE`. The same values live in `constants.logLevels`.

## Example

```js
ffmpeg.log.level = ffmpeg.log.INFO
```
