cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-harden REQUIRED PATHS node_modules/cmake-harden)
find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_ffmpeg C CXX)

option(BARE_FFMPEG_ENABLE_GPL "Enable GPL-licensed features (e.g., x264)" OFF)

fetch_package("github:holepunchto/libjstl#098664c")

set(ffmpeg_features dav1d svt-av1 opus)

if(BARE_FFMPEG_ENABLE_GPL)
  list(APPEND ffmpeg_features gpl x264)
endif()

find_port(ffmpeg FEATURES ${ffmpeg_features})

set(install_targets)

if(LINUX)
  list(APPEND install_targets TARGET va TARGET va-drm)
endif()

add_bare_module(bare_ffmpeg INSTALL ${install_targets})

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
  list(APPEND link_libraries va va-drm)
endif()

target_link_libraries(
  ${bare_ffmpeg}
  PRIVATE
    ${link_libraries}
)
