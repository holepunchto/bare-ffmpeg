cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-harden REQUIRED PATHS node_modules/cmake-harden)
find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_ffmpeg C CXX)

option(BARE_FFMPEG_ENABLE_GPL "Enable GPL-licensed features (e.g., x264)" OFF)

fetch_package("github:holepunchto/libjstl#7e31e67")

set(ffmpeg_features dav1d svt-av1 opus vpx)

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

  # libpulse and libasound are optional at runtime, so they're loaded with dlopen() instead of linked
  find_package(Threads REQUIRED)

  add_custom_command(
    OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/lazy-symbols.h"
    COMMAND
      "${CMAKE_COMMAND}"
      -D "NM=${CMAKE_NM}"
      -D "LIBRARY=${ffmpeg_PREFIX}/lib/libavdevice.a"
      -D "OUTPUT=${CMAKE_CURRENT_BINARY_DIR}/lazy-symbols.h"
      -P "${CMAKE_CURRENT_SOURCE_DIR}/cmake/lazy.cmake"
    DEPENDS
      "${ffmpeg_PREFIX}/lib/libavdevice.a"
      "${CMAKE_CURRENT_SOURCE_DIR}/cmake/lazy.cmake"
  )

  target_sources(
    ${bare_ffmpeg}
    PRIVATE
      lazy.c
      "${CMAKE_CURRENT_BINARY_DIR}/lazy-symbols.h"
  )

  target_include_directories(
    ${bare_ffmpeg}
    PRIVATE
      "${CMAKE_CURRENT_BINARY_DIR}"
  )

  target_compile_definitions(
    ${bare_ffmpeg}
    PRIVATE
      BARE_FFMPEG_LAZY
  )

  list(APPEND link_libraries ${CMAKE_DL_LIBS} Threads::Threads)
endif()

target_link_libraries(
  ${bare_ffmpeg}
  PRIVATE
    ${link_libraries}
)
