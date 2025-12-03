# bare-ffmpeg

Low-level FFmpeg bindings for Bare.

## Installation

```
npm i bare-ffmpeg
```

## API Documentation

Complete API documentation for all components is available in the `/docs` directory:

### Core Components

- [IOContext](docs/io-context.md) - Input/output context for media files with streaming support
- [Dictionary](docs/dictionary.md) - Key-value pairs for FFmpeg options

### Codecs & Streams

- [Codec](docs/codec.md) - Access to FFmpeg codecs
- [CodecContext](docs/codec-context.md) - Encoding/decoding functionality
- [CodecParameters](docs/codec-parameters.md) - Codec parameter configuration
- [Stream](docs/stream.md) - Media stream information and operations

### Formats

- [InputFormat](docs/input-format.md) - Input format specification
- [OutputFormat](docs/output-format.md) - Output format specification
- [FormatContext](docs/format-context.md) - Base class for media file handling
- [InputFormatContext](docs/input-format-context.md) - Reading media files
- [OutputFormatContext](docs/output-format-context.md) - Writing media files

### Data Structures

- [Frame](docs/frame.md) - Decoded audio/video data
- [Packet](docs/packet.md) - Encoded audio/video data
- [SideData](docs/side-data.md) - Packet side data and metadata
- [Image](docs/image.md) - Raw pixel data management
- [Rational](docs/rational.md) - Rational number (fraction) representation

### Processing

- [Scaler](docs/scaler.md) - Video scaling and pixel format conversion
- [Resampler](docs/resampler.md) - Audio resampling and format conversion
- [Filter](docs/filter.md) - FFmpeg filter access
- [FilterGraph](docs/filter-graph.md) - Filter chain management
- [FilterContext](docs/filter-context.md) - Filter instance representation
- [FilterInOut](docs/filter-in-out.md) - Filter input/output pads
- [AudioFIFO](docs/audio-fifo.md) - Audio sample buffering

### Hardware Acceleration

- [HWDeviceContext](docs/hw-device-context.md) - Hardware device context for acceleration
- [HWFramesContext](docs/hw-frames-context.md) - Hardware frame pool management
- [HWFramesConstraints](docs/hw-frames-constraints.md) - Hardware capability information

### Utilities

- [Constants](docs/constants.md) - FFmpeg constants and utility functions

## Building

<https://github.com/holepunchto/bare-make> is used for compiling Bare. Start by installing the tool globally:

```console
npm i -g bare-make
```

Next, install the required build and runtime dependencies:

```console
npm i
```

Then, generate the build system:

```console
bare-make generate
```

This only has to be run once per repository checkout. When updating `bare-make` or your compiler toolchain it might also be necessary to regenerate the build system. To do so, run the command again with the `--no-cache` flag set to disregard the existing build system cache:

```console
bare-make generate --no-cache
```

With a build system generated, Bare can be compiled:

```console
bare-make build
```

When completed, the `bare-ffmpeg@1.bare` binary will be available in the `build` directory. We still need to populate this binary to the `prebuilds` directory. It can be done with:

```console
bare-make install
```

After the install step completes, the addon will appear in the `prebuilds` directory under `<platform>-<arch>`. For example, on Apple Silicon macOS:

```console
ls prebuilds/
darwin-arm64
```

### Options

A few compile options can be configured to customize the addon. Compile options may be set by passing the `--define option=value` flag to the `bare-make generate` command when generating the build system.

> [!WARNING]
> The compile options are not covered by semantic versioning and are subject to change without warning.

| Option                   | Default | Description                              |
| :----------------------- | :------ | :--------------------------------------- |
| `BARE_FFMPEG_ENABLE_GPL` | `OFF`   | Enable GPL-licensed features (e.g, x264) |

## License

Apache-2.0
