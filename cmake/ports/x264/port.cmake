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

if(ANDROID)
  message(STATUS "TEST -- ANDROID_NDK ${ANDROID_NDK}")
  set(ndk_triple "${CMAKE_SYSTEM_PROCESSOR}-linux-android")

  list(APPEND args --host=${ndk_triple})
  list(APPEND args
    "--extra-cflags=--target=${CMAKE_C_COMPILER_TARGET} -isysroot ${CMAKE_SYSROOT}"
    "--extra-ldflags=--target=${CMAKE_C_COMPILER_TARGET} -isysroot ${CMAKE_SYSROOT}"
  )
  list(APPEND args --disable-asm)
endif()

if(WIN32)
  if(CMAKE_SYSTEM_PROCESSOR STREQUAL "ARM64" OR CMAKE_SYSTEM_PROCESSOR STREQUAL "aarch64")
    list(APPEND args --host=aarch64-w64-mingw32)
  endif()

  list(APPEND args --disable-asm)
  list(APPEND args
    "--extra-cflags=--target=${CMAKE_C_COMPILER_TARGET}"
    "--extra-ldflags=--target=${CMAKE_C_COMPILER_TARGET}"
  )
endif()

set(env)

if(ANDROID)
  message(STATUS "TEST -- CMAKE_C_COMPILER ${CMAKE_C_COMPILER}")
  if(CMAKE_C_COMPILER)

    list(APPEND env "CC=${CMAKE_C_COMPILER}")
  endif()
endif()

if(WIN32)
  cmake_path(GET CMAKE_C_COMPILER PARENT_PATH CC_path)
  cmake_path(GET CMAKE_C_COMPILER FILENAME CC_filename)

  if(CC_filename MATCHES "clang-cl.exe")
    set(CC_filename "clang.exe")
  endif()

  list(APPEND env "CC=${CC_filename}")
  list(APPEND env --modify "PATH=path_list_prepend:${CC_path}")
endif()

declare_port(
  "git:code.videolan.org/videolan/x264#stable"
  x264
  AUTOTOOLS
  BYPRODUCTS lib/libx264.a
  ARGS ${args}
  ENV ${env}
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
