cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_ffmpeg C CXX)

bare_arch(arch)

if(arch MATCHES "arm64")
  set(OPUS_MAY_HAVE_NEON OFF CACHE BOOL "" FORCE)
  set(OPUS_PRESUME_NEON ON CACHE BOOL "" FORCE)
endif()

fetch_package("github:holepunchto/libjstl#122cbdd")
fetch_package("github:xiph/opus#c0eb2ca")

find_port(ffmpeg FEATURES dav1d x264)

add_bare_module(bare_ffmpeg)

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
