cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-harden REQUIRED PATHS node_modules/cmake-harden)
find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_ffmpeg C CXX)

fetch_package("github:holepunchto/libjstl#098664c")

find_port(ffmpeg FEATURES dav1d svt-av1 opus)

if(LINUX)
  add_bare_module(bare_ffmpeg INSTALL TARGET va)
else()
  add_bare_module(bare_ffmpeg)
endif()

harden(${bare_ffmpeg})

target_sources(
  ${bare_ffmpeg}
  PRIVATE
    binding.cc
)

set(link_libraries
  avcodec
  avdevice
  avformat
  avutil
  swresample
  swscale
  jstl
)

if(LINUX)
  list(APPEND link_libraries va)
endif()

target_link_libraries(
  ${bare_ffmpeg}
  PRIVATE
    ${link_libraries}
)
