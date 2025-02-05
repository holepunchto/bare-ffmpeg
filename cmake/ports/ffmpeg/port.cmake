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

  list(APPEND byproducts lib/lib${name}.a)
endforeach()

set(args
  --disable-autodetect
  --disable-doc
  --disable-programs
  --disable-network

  --enable-pic
  --enable-cross-compile
)

if(CMAKE_BUILD_TYPE MATCHES "Release")
  list(APPEND args --disable-debug)
elseif(CMAKE_BUILD_TYPE MATCHES "Debug")
  list(APPEND args --disable-optimizations)
elseif(CMAKE_BUILD_TYPE MATCHES "MinSizeRel")
  list(APPEND args --disable-debug --enable-small)
endif()

if(APPLE AND CMAKE_OSX_ARCHITECTURES)
  set(arch ${CMAKE_OSX_ARCHITECTURES})
elseif(MSVC AND CMAKE_GENERATOR_PLATFORM)
  set(arch ${CMAKE_GENERATOR_PLATFORM})
elseif(ANDROID AND CMAKE_ANDROID_ARCH_ABI)
  set(arch ${CMAKE_ANDROID_ARCH_ABI})
elseif(CMAKE_SYSTEM_PROCESSOR)
  set(arch ${CMAKE_SYSTEM_PROCESSOR})
else()
  set(arch ${CMAKE_HOST_SYSTEM_PROCESSOR})
endif()

string(TOLOWER "${arch}" arch)

list(APPEND args --arch=${arch})

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
  )
elseif(WIN32)
  list(APPEND args
    --target-os=win32

    --toolchain=msvc

    --enable-w32threads
    --enable-d3d11va
    --enable-d3d12va
    --enable-dxva2
    --enable-mediafoundation
  )
endif()

set(env)

if(CMAKE_C_COMPILER)
  cmake_path(GET CMAKE_C_COMPILER PARENT_PATH CC_path)
  cmake_path(GET CMAKE_C_COMPILER FILENAME CC_filename)

  list(APPEND args
    "--cc=${CC_filename}"
    "--extra-cflags=--target=${CMAKE_C_COMPILER_TARGET}"
  )

  list(APPEND env --modify "PATH=path_list_prepend:${CC_path}")
endif()

if(CMAKE_CXX_COMPILER)
  cmake_path(GET CMAKE_CXX_COMPILER PARENT_PATH CXX_path)
  cmake_path(GET CMAKE_CXX_COMPILER FILENAME CXX_filename)

  list(APPEND args
    "--cxx=${CXX_filename}"
    "--extra-cxxflags=--target=${CMAKE_CXX_COMPILER_TARGET}"
  )

  list(APPEND env --modify "PATH=path_list_prepend:${CXX_path}")
endif()

if(CMAKE_OBJC_COMPILER)
  cmake_path(GET CMAKE_OBJC_COMPILER PARENT_PATH OBJC_path)
  cmake_path(GET CMAKE_OBJC_COMPILER FILENAME OBJC_filename)

  list(APPEND args
    "--objcc=${OBJC_filename}"
    "--extra-objcflags=--target=${CMAKE_OBJC_COMPILER_TARGET}"
  )

  list(APPEND env --modify "PATH=path_list_prepend:${OBJC_path}")
endif()

if(CMAKE_ASM_COMPILER)
  cmake_path(GET CMAKE_ASM_COMPILER PARENT_PATH AS_path)
  cmake_path(GET CMAKE_ASM_COMPILER FILENAME AS_filename)

  list(APPEND args "--as=${AS_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${AS_path}")
endif()

if(CMAKE_RC_COMPILER)
  cmake_path(GET CMAKE_RC_COMPILER PARENT_PATH RC_path)
  cmake_path(GET CMAKE_RC_COMPILER FILENAME RC_filename)

  list(APPEND args "--windres=${RC_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${RC_path}")
endif()

if(WIN32 AND CMAKE_LINKER)
  cmake_path(GET CMAKE_LINKER PARENT_PATH LD_path)
  cmake_path(GET CMAKE_LINKER FILENAME LD_filename)

  list(APPEND args
    "--ld=${LD_filename}"
    "--extra-ldflags=libcmt.lib"
  )

  list(APPEND env --modify "PATH=path_list_prepend:${LD_path}")
else()
  list(APPEND args "--extra-ldflags=--target=${CMAKE_C_COMPILER_TARGET}")
endif()

if(CMAKE_AR)
  cmake_path(GET CMAKE_AR PARENT_PATH AR_path)
  cmake_path(GET CMAKE_AR FILENAME AR_filename)

  list(APPEND args "--ar=${AR_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${AR_path}")
endif()

if(CMAKE_NM)
  cmake_path(GET CMAKE_NM PARENT_PATH NM_path)
  cmake_path(GET CMAKE_NM FILENAME NM_filename)

  list(APPEND args "--nm=${NM_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${NM_path}")
endif()

if(CMAKE_RANLIB)
  cmake_path(GET CMAKE_RANLIB PARENT_PATH RANLIB_path)
  cmake_path(GET CMAKE_RANLIB FILENAME RANLIB_filename)

  list(APPEND args "--ranlib=${RANLIB_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${RANLIB_path}")
endif()

if(CMAKE_STRIP)
  cmake_path(GET CMAKE_STRIP PARENT_PATH STRIP_path)
  cmake_path(GET CMAKE_STRIP FILENAME STRIP_filename)

  list(APPEND args "--strip=${STRIP_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${STRIP_path}")
endif()

set(depends)

if("dav1d" IN_LIST features)
  find_port(dav1d)

  list(APPEND depends dav1d)
  list(APPEND args --enable-libdav1d)
  list(APPEND env --modify "PKG_CONFIG_PATH=path_list_prepend:${dav1d_PREFIX}/lib/pkgconfig")

  target_link_libraries(avcodec INTERFACE dav1d)
endif()

if(CMAKE_HOST_WIN32)
  file(REAL_PATH "/tools/msys64" msys2)

  find_program(
    pkg-config
    NAMES pkg-config
    PATHS "${msys2}/usr/bin"
    REQUIRED
    NO_DEFAULT_PATH
  )
else()
  find_program(
    pkg-config
    NAMES pkg-config
    REQUIRED
  )
endif()

list(APPEND args "--pkg-config=${pkg-config}")

if(WIN32)
  list(APPEND args "--pkg-config-flags=--static --msvc")
else()
  list(APPEND args "--pkg-config-flags=--static")
endif()

declare_port(
  "git:git.ffmpeg.org/ffmpeg#n7.1"
  ffmpeg
  AUTOTOOLS
  DEPENDS ${depends}
  BYPRODUCTS ${byproducts}
  ARGS ${args}
  ENV ${env}
)

file(MAKE_DIRECTORY "${ffmpeg_PREFIX}/include")

foreach(name IN LISTS libraries)
  add_dependencies(${name} ${ffmpeg})

  set_target_properties(
    ${name}
    PROPERTIES
    IMPORTED_LOCATION "${ffmpeg_PREFIX}/lib/lib${name}.a"
  )

  target_include_directories(
    ${name}
    INTERFACE "${ffmpeg_PREFIX}/include"
  )

  if(LINUX OR ANDROID)
    target_link_options(
      ${name}
      INTERFACE
        "-Wl,-Bsymbolic"
    )
  endif()
endforeach()

target_link_libraries(
  avcodec
  INTERFACE
    avutil
    swresample
)

target_link_libraries(
  avdevice
  INTERFACE
    avcodec
    avfilter
    avformat
    avutil
    swresample
    swscale
)

target_link_libraries(
  avfilter
  INTERFACE
    avcodec
    avformat
    avutil
    swresample
    swscale
)

target_link_libraries(
  avformat
  INTERFACE
    avcodec
    avutil
    swresample
)

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
elseif(WIN32)
  target_link_libraries(
    avcodec
    INTERFACE
      mfuuid
      ole32
      ole32
      strmiids
      user32
  )

  target_link_libraries(
    avdevice
    INTERFACE
      gdi32
      ole32
      oleaut32
      psapi
      shlwapi
      strmiids
      uuid
      vfw32
  )

  target_link_libraries(
    avutil
    INTERFACE
      user32
      bcrypt
  )
endif()
