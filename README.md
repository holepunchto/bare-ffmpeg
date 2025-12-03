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

## License

Apache-2.0
