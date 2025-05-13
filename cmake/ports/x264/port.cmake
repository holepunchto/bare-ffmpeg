include_guard(GLOBAL)

set(env)

set(args
  --disable-cli

  --enable-static
  --enable-strip
  --enable-pic
)

if(CMAKE_SYSTEM_NAME)
  set(platform ${CMAKE_SYSTEM_NAME})
else()
  set(platform ${CMAKE_HOST_SYSTEM_NAME})
endif()

string(TOLOWER "${platform}" platform)

if(platform MATCHES "darwin|ios")
  set(platform "darwin")
elseif(platform MATCHES "linux|android")
  set(platform "linux")
elseif(platform MATCHES "windows")
  set(platform "msys")
else()
  message(FATAL_ERROR "Unsupported platform '${platform}'")
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
  set(arch "x86_64")
elseif(arch MATCHES "x86|i386|i486|i586|i686")
  set(arch "i686")
else()
  message(FATAL_ERROR "Unsupported architecture '${arch}'")
endif()

list(APPEND args --host=${arch}-${platform})

if(CMAKE_C_COMPILER)
  cmake_path(GET CMAKE_C_COMPILER PARENT_PATH CC_path)
  cmake_path(GET CMAKE_C_COMPILER FILENAME CC_filename)

  if(WIN32 AND CC_filename MATCHES "clang-cl.exe")
    set(CC_filename "clang.exe")
  endif()

  list(APPEND env "CC=${CC_path}/${CC_filename}")

  list(APPEND args
    --extra-cflags=--target=${CMAKE_C_COMPILER_TARGET}
    --extra-ldflags=--target=${CMAKE_C_COMPILER_TARGET}
  )

  if(CMAKE_LINKER_TYPE MATCHES "LLD")
    list(APPEND args --extra-ldflags=-fuse-ld=lld)
  endif()
endif()

if(CMAKE_ASM_NASM_COMPILER)
  cmake_path(GET CMAKE_ASM_NASM_COMPILER PARENT_PATH AS_path)
  cmake_path(GET CMAKE_ASM_NASM_COMPILER FILENAME AS_filename)

  list(APPEND env "AS=${AS_path}/${AS_filename}")
elseif(CMAKE_ASM_COMPILER)
  cmake_path(GET CMAKE_ASM_COMPILER PARENT_PATH AS_path)
  cmake_path(GET CMAKE_ASM_COMPILER FILENAME AS_filename)

  if(WIN32 AND AS_filename MATCHES "clang-cl.exe")
    set(AS_filename "clang.exe")
  endif()

  list(APPEND env "AS=${AS_path}/${AS_filename}")

  list(APPEND args --extra-asflags=--target=${CMAKE_ASM_COMPILER_TARGET})
endif()

if(CMAKE_RC_COMPILER)
  cmake_path(GET CMAKE_RC_COMPILER PARENT_PATH RC_path)
  cmake_path(GET CMAKE_RC_COMPILER FILENAME RC_filename)

  list(APPEND env "RC=${RC_path}/${RC_filename}")
endif()

if(APPLE)
  list(APPEND args --sysroot=${CMAKE_OSX_SYSROOT})
endif()

if(ANDROID)
  list(APPEND args --sysroot=${CMAKE_SYSROOT})

  if(arch MATCHES "x86_64|i686")
    list(APPEND args --disable-asm)
  endif()
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
