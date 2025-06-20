cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-harden REQUIRED PATHS node_modules/cmake-harden)
find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_ffmpeg C CXX)

bare_arch(arch)

fetch_package("github:holepunchto/libjstl#5b85a24")

find_port(ffmpeg FEATURES dav1d svt-av1 x264 opus)

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
