cmake_minimum_required(VERSION 3.25)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-ports REQUIRED PATHS node_modules/cmake-ports)

project(bare_ffmpeg C)

find_port(ffmpeg FEATURES dav1d x264)

add_bare_module(bare_ffmpeg)

target_sources(
  ${bare_ffmpeg}
  PRIVATE
    binding.c
)

set(CMAKE_PREFIX_PATH "/opt/homebrew") # So FindSDL2 can work
find_package(SDL2 REQUIRED)

target_include_directories(${bare_ffmpeg} PRIVATE ${SDL2_INCLUDE_DIRS})
target_link_libraries(${bare_ffmpeg} PRIVATE ${SDL2_LIBRARIES})

target_link_libraries(
  ${bare_ffmpeg}
  PRIVATE
    avcodec
    avdevice
    avformat
    avutil
    swscale
    sdl2
)
