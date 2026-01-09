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

set(path)
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

if(arch MATCHES "arm64|aarch64")
  set(arch "aarch64")
elseif(arch MATCHES "armv7-a|armeabi-v7a")
  set(arch "arm")
elseif(arch MATCHES "x64|x86_64|amd64")
  set(arch "x64")
elseif(arch MATCHES "x86|i386|i486|i586|i686")
  set(arch "x86_32")
else()
  message(FATAL_ERROR "Unsupported architecture '${arch}'")
endif()

list(APPEND args --arch=${arch})

if(APPLE)
  list(APPEND args
    --target-os=darwin

    "--sysroot=${CMAKE_OSX_SYSROOT}"

    --enable-avfoundation
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

  if(arch MATCHES "x86_32")
    list(APPEND args --disable-asm)
  endif()
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

set(env)

if(CMAKE_C_COMPILER)
  cmake_path(GET CMAKE_C_COMPILER PARENT_PATH CC_path)
  cmake_path(GET CMAKE_C_COMPILER FILENAME CC_filename)

  if(WIN32 AND CC_filename MATCHES "clang-cl.exe")
    set(CC_filename "clang.exe")
  endif()

  list(APPEND path "${CC_path}")

  # For Android cross-compilation, use native compiler as host-cc
  if(ANDROID)
    list(APPEND args
      "--cc=${CC_filename}"
      "--host-cc=cc"
      "--extra-cflags=--target=${CMAKE_C_COMPILER_TARGET}"
      "--ld=${CC_filename}"
      "--host-ld=cc"
      "--extra-ldflags=--target=${CMAKE_C_COMPILER_TARGET}"
    )
  else()
    list(APPEND args
      "--cc=${CC_filename}"
      "--host-cc=${CC_filename}"
      "--extra-cflags=--target=${CMAKE_C_COMPILER_TARGET}"
      "--ld=${CC_filename}"
      "--host-ld=${CC_filename}"
      "--extra-ldflags=--target=${CMAKE_C_COMPILER_TARGET}"
    )
  endif()

  if(CMAKE_LINKER_TYPE MATCHES "LLD")
    list(APPEND args --extra-ldflags=-fuse-ld=lld)
  endif()
endif()

if(CMAKE_CXX_COMPILER)
  cmake_path(GET CMAKE_CXX_COMPILER PARENT_PATH CXX_path)
  cmake_path(GET CMAKE_CXX_COMPILER FILENAME CXX_filename)

  if(WIN32 AND CXX_filename MATCHES "clang-cl.exe")
    set(CXX_filename "clang.exe")
  endif()

  list(APPEND path "${CXX_path}")
  list(APPEND args
    "--cxx=${CXX_filename}"
    "--extra-cxxflags=--target=${CMAKE_CXX_COMPILER_TARGET}"
  )
endif()

if(CMAKE_OBJC_COMPILER)
  cmake_path(GET CMAKE_OBJC_COMPILER PARENT_PATH OBJC_path)
  cmake_path(GET CMAKE_OBJC_COMPILER FILENAME OBJC_filename)

  list(APPEND path "${OBJC_path}")
  list(APPEND args
    "--objcc=${OBJC_filename}"
    "--extra-objcflags=--target=${CMAKE_OBJC_COMPILER_TARGET}"
  )
endif()

if(CMAKE_ASM_COMPILER)
  cmake_path(GET CMAKE_ASM_COMPILER PARENT_PATH AS_path)
  cmake_path(GET CMAKE_ASM_COMPILER FILENAME AS_filename)

  if(WIN32 AND AS_filename MATCHES "clang-cl.exe")
    set(AS_filename "clang.exe")
  endif()

  list(APPEND path "${AS_path}")
  list(APPEND args "--as=${AS_filename}")
endif()

if(CMAKE_RC_COMPILER)
  cmake_path(GET CMAKE_RC_COMPILER PARENT_PATH RC_path)
  cmake_path(GET CMAKE_RC_COMPILER FILENAME RC_filename)

  list(APPEND path "${RC_path}")
  list(APPEND args "--windres=${RC_filename}")
endif()

if(CMAKE_AR)
  cmake_path(GET CMAKE_AR PARENT_PATH AR_path)
  cmake_path(GET CMAKE_AR FILENAME AR_filename)

  if(WIN32 AND AR_filename MATCHES "llvm-lib.exe")
    set(AR_filename "llvm-ar.exe")
  endif()

  list(APPEND path "${AR_path}")
  list(APPEND args "--ar=${AR_filename}")
endif()

if(CMAKE_NM)
  cmake_path(GET CMAKE_NM PARENT_PATH NM_path)
  cmake_path(GET CMAKE_NM FILENAME NM_filename)

  list(APPEND path "${NM_path}")
  list(APPEND args "--nm=${NM_filename}")
endif()

if(CMAKE_RANLIB)
  cmake_path(GET CMAKE_RANLIB PARENT_PATH RANLIB_path)
  cmake_path(GET CMAKE_RANLIB FILENAME RANLIB_filename)

  list(APPEND path "${RANLIB_path}")
  list(APPEND args "--ranlib=${RANLIB_filename}")
endif()

if(CMAKE_STRIP)
  cmake_path(GET CMAKE_STRIP PARENT_PATH STRIP_path)
  cmake_path(GET CMAKE_STRIP FILENAME STRIP_filename)

  list(APPEND path "${STRIP_path}")
  list(APPEND args "--strip=${STRIP_filename}")
endif()

set(depends)
set(pkg_config_path)

if("gpl" IN_LIST features)
  list(APPEND args --enable-gpl)
endif()

if("zlib" IN_LIST features)
  list(APPEND args --enable-zlib)
endif()

if("dav1d" IN_LIST features)
  find_port(dav1d)

  list(APPEND depends dav1d)
  list(APPEND args --enable-libdav1d)
  list(APPEND pkg_config_path "${dav1d_PREFIX}/lib/pkgconfig")

  target_link_libraries(avcodec INTERFACE dav1d)
endif()

if("svt-av1" IN_LIST features)
  find_port(svt-av1)

  list(APPEND depends svt-av1)
  list(APPEND args --enable-libsvtav1)
  list(APPEND pkg_config_path "${svt-av1_PREFIX}/lib/pkgconfig")

  target_link_libraries(avcodec INTERFACE svt-av1)
endif()

if("x264" IN_LIST features)
  find_port(x264)

  list(APPEND depends x264)
  list(APPEND args --enable-libx264)
  list(APPEND pkg_config_path "${x264_PREFIX}/lib/pkgconfig")

  target_link_libraries(avcodec INTERFACE x264)
endif()

if("opus" IN_LIST features)
  find_port(opus)

  list(APPEND depends opus)
  list(APPEND args --enable-libopus)
  list(APPEND pkg_config_path "${opus_PREFIX}/lib/pkgconfig")

  target_link_libraries(avcodec INTERFACE opus)
endif()

if("vpx" IN_LIST features)
  find_port(libvpx)

  list(APPEND depends vpx)
  list(APPEND args
    --enable-libvpx
    --enable-encoder=libvpx
    --enable-encoder=libvpx_vp9
    --enable-decoder=vp8
    --enable-decoder=vp9
    "--extra-cflags=-I${libvpx_PREFIX}/include"
    "--extra-ldflags=-L${libvpx_PREFIX}/lib"
  )
  list(APPEND pkg_config_path "${libvpx_PREFIX}/lib/pkgconfig")

  target_link_libraries(avcodec INTERFACE vpx)
endif()

if(LINUX)
  find_port(libva)

  list(APPEND args --enable-vaapi)
  list(APPEND pkg_config_path "${libva_PREFIX}/lib/pkgconfig")
  list(APPEND pkg_config_path "${libdrm_PREFIX}/lib/pkgconfig")
endif()

if(CMAKE_HOST_WIN32)
  find_path(
    msys2
    NAMES msys2.exe
    PATHS "C:/tools/msys64"
    REQUIRED
  )

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

foreach(part "$ENV{PATH}")
  cmake_path(NORMAL_PATH part)

  list(APPEND path "${part}")
endforeach()

list(APPEND args
  "--pkg-config=${pkg-config}"
  "--pkg-config-flags=--static"
)

list(REMOVE_DUPLICATES path)
list(REMOVE_DUPLICATES pkg_config_path)

if(CMAKE_HOST_WIN32)
  list(TRANSFORM path REPLACE "([A-Z]):" "/\\1")
  list(TRANSFORM pkg_config_path REPLACE "([A-Z]):" "/\\1")
endif()

list(JOIN path ":" path)
list(JOIN pkg_config_path ":" pkg_config_path)

list(APPEND env
  "PATH=${path}"
  "PKG_CONFIG_PATH=${pkg_config_path}"
)

declare_port(
  "github:FFmpeg/FFmpeg#n8.0"
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

target_link_libraries(
  swresample
  INTERFACE
    avutil
)

target_link_libraries(
  swscale
  INTERFACE
    avutil
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
    avdevice
    INTERFACE
      "-framework AVFoundation"
      "-framework CoreAudio"
      "-framework CoreGraphics"
      "-framework CoreMedia"
      "-framework CoreVideo"
      "-framework Foundation"
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

    target_link_libraries(
      avdevice
      INTERFACE
        "-framework AudioToolbox"
    )
  endif()
elseif(ANDROID)
  target_link_libraries(
    avcodec
    INTERFACE
      android
      mediandk
  )

  target_link_libraries(
    avdevice
    INTERFACE
      android
      camera2ndk
      mediandk
  )

  target_link_libraries(
    avutil
    INTERFACE
      android
      mediandk
  )
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
