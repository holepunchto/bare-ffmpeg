#!/usr/bin/env bash

# Set PKG_CONFIG_PATH from CMake
export PKG_CONFIG_PATH="/Users/tonygo/bare/bare-ffmpeg/build/_ports/git+code.videolan.org+videolan+dav1d/lib/pkgconfig:/Users/tonygo/bare/bare-ffmpeg/build/_ports/git+code.videolan.org+videolan+x264/lib/pkgconfig"

echo "Running: /Users/tonygo/bare/bare-ffmpeg/build/_ports/git+git.ffmpeg.org+ffmpeg/src/git+git.ffmpeg.org+ffmpeg/configure $@"

# Execute the command with all arguments
exec /Users/tonygo/bare/bare-ffmpeg/build/_ports/git+git.ffmpeg.org+ffmpeg/src/git+git.ffmpeg.org+ffmpeg/configure "$@"
