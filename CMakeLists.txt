cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_ffmpeg C)

find_port(ffmpeg FEATURES dav1d)

add_bare_module(bare_ffmpeg)

target_sources(
  ${bare_ffmpeg}
  PRIVATE
    binding.c
)

target_link_libraries(
  ${bare_ffmpeg}
  PRIVATE
    avcodec
    avdevice
    avformat
    avutil
    swscale
)
