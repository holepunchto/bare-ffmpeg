cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-harden REQUIRED PATHS node_modules/cmake-harden)
find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_ffmpeg C CXX)

fetch_package("github:holepunchto/libjstl#098664c")

find_program(
  pkg-config
  NAMES pkg-config
  REQUIRED
)

set(CMAKE_PKG_CONFIG "${pkg-config}" CACHE STRING "Path to pkg-config" FORCE)

find_port(ffmpeg FEATURES dav1d svt-av1 opus)

add_bare_module(bare_ffmpeg)

harden(${bare_ffmpeg})

target_sources(
  ${bare_ffmpeg}
  PRIVATE
    binding.cc
)

target_link_libraries(
  ${bare_ffmpeg}
  PRIVATE
    avcodec
    avdevice
    avformat
    avutil
    swresample
    swscale
    jstl
)
