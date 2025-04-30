include_guard(GLOBAL)

set(args)

list(APPEND args
  --enable-static
  --enable-strip
  --enable-pic
  --disable-cli
)

if(IOS)
  if(CMAKE_SYSTEM_PROCESSOR STREQUAL "x86_64")
    list(APPEND args --host=x86_64-apple-darwin)
  else()
    list(APPEND args --host=arm-apple-darwin)
  endif()

  list(APPEND args --disable-asm)
  list(APPEND args "--extra-cflags=-arch ${CMAKE_SYSTEM_PROCESSOR} -isysroot ${CMAKE_OSX_SYSROOT}")
  list(APPEND args "--extra-ldflags=-arch ${CMAKE_SYSTEM_PROCESSOR} -isysroot ${CMAKE_OSX_SYSROOT}")
endif()

declare_port(
  "git:code.videolan.org/videolan/x264#stable"
  x264
  AUTOTOOLS
  BYPRODUCTS lib/libx264.a
  ARGS ${args}
)

add_library(x264 STATIC IMPORTED GLOBAL)

add_dependencies(x264 ${x264})

set_target_properties(
  x264
  PROPERTIES
  IMPORTED_LOCATION "${x264_PREFIX}/lib/libx264.a"
)

file(MAKE_DIRECTORY "${x264_PREFIX}/include")

target_include_directories(
  x264
  INTERFACE "${x264_PREFIX}/include"
)
