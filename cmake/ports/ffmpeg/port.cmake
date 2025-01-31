include_guard(GLOBAL)

set(libraries
  avcodec
  avdevice
  avfilter
  avformat
  avutil
  swresample
  swscale
)

set(byproducts)

foreach(name IN LISTS libraries)
  add_library(${name} STATIC IMPORTED GLOBAL)

  if(WIN32)
    set(lib lib${name}.lib)
  else()
    set(lib lib${name}.a)
  endif()

  list(APPEND byproducts lib/${lib})
endforeach()

set(args
  --disable-autodetect
  --disable-doc
  --disable-programs
  --disable-network

  --enable-pic
  --enable-cross-compile

  "--cc=${CMAKE_C_COMPILER}"
  "--extra-cflags=--target=${CMAKE_C_COMPILER_TARGET}"

  "--cxx=${CMAKE_CXX_COMPILER}"
  "--extra-cxxflags=--target=${CMAKE_CXX_COMPILER_TARGET}"
)

if(CMAKE_BUILD_TYPE MATCHES "Release")
  list(APPEND args --disable-debug)
elseif(CMAKE_BUILD_TYPE MATCHES "Debug")
  list(APPEND args --disable-optimizations)
elseif(CMAKE_BUILD_TYPE MATCHES "MinSizeRel")
  list(APPEND args --disable-debug --enable-small)
endif()

if(CMAKE_OBJC_COMPILER)
  list(APPEND args
    "--objcc=${CMAKE_OBJC_COMPILER}"
    "--extra-objcflags=--target=${CMAKE_OBJC_COMPILER_TARGET}"
  )
endif()

if(CMAKE_RC_COMPILER)
  list(APPEND args "--windres=${CMAKE_RC_COMPILER}")
endif()

if(WIN32 AND CMAKE_LINKER)
  list(APPEND args "--ld=${CMAKE_LINKER}")
else()
  list(APPEND args "--extra-ldflags=--target=${CMAKE_C_COMPILER_TARGET}")
endif()

if(CMAKE_AR)
  list(APPEND args "--ar=${CMAKE_AR}")
endif()

if(CMAKE_NM)
  list(APPEND args "--nm=${CMAKE_NM}")
endif()

if(CMAKE_RANLIB)
  list(APPEND args "--ranlib=${CMAKE_RANLIB}")
endif()

if(CMAKE_STRIP)
  list(APPEND args "--strip=${CMAKE_STRIP}")
endif()

if(APPLE)
  list(APPEND args
    --target-os=darwin

    "--sysroot=${CMAKE_OSX_SYSROOT}"

    --enable-avfoundation
    --enable-coreimage
    --enable-videotoolbox
  )

  if(NOT IOS)
    list(APPEND args
      --enable-appkit
      --enable-audiotoolbox
    )
  endif()
elseif(LINUX)
  list(APPEND args
    --target-os=linux

    "--sysroot=${CMAKE_SYSROOT}"

    --enable-pthreads
  )
elseif(ANDROID)
  list(APPEND args
    --target-os=android

    "--sysroot=${CMAKE_SYSROOT}"

    --enable-jni
    --enable-mediacodec

    --disable-asm
    --disable-x86asm
  )
elseif(WIN32)
  list(APPEND args
    --target-os=win32

    --enable-w32threads
    --enable-d3d11va
    --enable-d3d12va
    --enable-dxva2
    --enable-mediafoundation
  )
endif()

set(depends)

if("dav1d" IN_LIST features)
  find_port(dav1d)

  list(APPEND depends dav1d)
  list(APPEND args --enable-libdav1d)

  target_link_libraries(avcodec INTERFACE dav1d)
endif()

declare_port(
  "git:git.ffmpeg.org/ffmpeg#n7.1"
  ffmpeg
  AUTOTOOLS
  DEPENDS ${depends}
  BYPRODUCTS ${byproducts}
  ARGS ${args}
)

file(MAKE_DIRECTORY "${ffmpeg_PREFIX}/include")

foreach(name IN LISTS libraries)
  add_dependencies(${name} ${ffmpeg})

  if(WIN32)
    set(lib lib${name}.lib)
  else()
    set(lib lib${name}.a)
  endif()

  set_target_properties(
    ${name}
    PROPERTIES
    IMPORTED_LOCATION "${ffmpeg_PREFIX}/lib/${lib}"
  )

  target_include_directories(
    ${name}
    INTERFACE "${ffmpeg_PREFIX}/include"
  )

  target_link_options(
    ${name}
    INTERFACE
      "-Wl,-Bsymbolic"
  )
endforeach()

if(APPLE)
  target_link_libraries(
    avcodec
    INTERFACE
      "-framework VideoToolbox"
      "-framework CoreFoundation"
      "-framework CoreMedia"
      "-framework CoreVideo"
      "-framework CoreServices"
  )

  target_link_libraries(
    avutil
    INTERFACE
      "-framework VideoToolbox"
      "-framework CoreFoundation"
      "-framework CoreMedia"
      "-framework CoreVideo"
      "-framework CoreServices"
  )

  if(NOT IOS)
    target_link_libraries(
      avcodec
      INTERFACE
        "-framework AudioToolbox"
    )
  endif()
endif()
