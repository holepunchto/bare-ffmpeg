# bare-ffmpeg

Low-level FFmpeg bindings for Bare.

## Installation

```
npm i bare-ffmpeg
```

## API Documentation

Complete API documentation for all components is available in the `/docs` directory:

### Core Components

- [IOContext](docs/IOContext.md) - Input/output context for media files with streaming support
- [Dictionary](docs/Dictionary.md) - Key-value pairs for FFmpeg options
- [FormatContext](docs/FormatContext.md) - Base class for media file handling
- [InputFormatContext](docs/InputFormatContext.md) - Reading media files
- [OutputFormatContext](docs/OutputFormatContext.md) - Writing media files

### Codecs & Streams

- [Codec](docs/Codec.md) - Access to FFmpeg codecs
- [CodecContext](docs/CodecContext.md) - Encoding/decoding functionality
- [CodecParameters](docs/CodecParameters.md) - Codec parameter configuration
- [Stream](docs/Stream.md) - Media stream information and operations

### Formats

- [InputFormat](docs/InputFormat.md) - Input format specification
- [OutputFormat](docs/OutputFormat.md) - Output format specification

### Data Structures

- [Frame](docs/Frame.md) - Decoded audio/video data
- [Packet](docs/Packet.md) - Encoded audio/video data
- [SideData](docs/SideData.md) - Packet side data and metadata
- [Image](docs/Image.md) - Raw pixel data management
- [Rational](docs/Rational.md) - Rational number (fraction) representation

### Processing

- [Scaler](docs/Scaler.md) - Video scaling and pixel format conversion
- [Resampler](docs/Resampler.md) - Audio resampling and format conversion
- [Filter](docs/Filter.md) - FFmpeg filter access
- [FilterGraph](docs/FilterGraph.md) - Filter chain management
- [FilterContext](docs/FilterContext.md) - Filter instance representation
- [FilterInOut](docs/FilterInOut.md) - Filter input/output pads
- [AudioFIFO](docs/AudioFIFO.md) - Audio sample buffering

### Hardware Acceleration

- [HWDeviceContext](docs/HWDeviceContext.md) - Hardware device context for acceleration
- [HWFramesContext](docs/HWFramesContext.md) - Hardware frame pool management
- [HWFramesConstraints](docs/HWFramesConstraints.md) - Hardware capability information

### Utilities

- [Constants](docs/Constants.md) - FFmpeg constants and utility functions

## License

Apache-2.0
