include_guard(GLOBAL)

if(WIN32)
  set(lib x264.lib)
else()
  set(lib libx264.a)
endif()

set(env)

set(args
  --disable-cli

  --enable-static
  --enable-strip
  --enable-pic
)

if(CMAKE_BUILD_TYPE MATCHES "Debug|RelWithDebInfo")
  list(APPEND args --enable-debug)
endif()

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

if(APPLE)
  list(APPEND args --sysroot=${CMAKE_OSX_SYSROOT})
elseif(ANDROID)
  list(APPEND args --sysroot=${CMAKE_SYSROOT} --disable-asm)
elseif(WIN32)
  list(APPEND args --disable-asm)
endif()

if(CMAKE_C_COMPILER)
  cmake_path(GET CMAKE_C_COMPILER PARENT_PATH CC_path)
  cmake_path(GET CMAKE_C_COMPILER FILENAME CC_filename)

  list(APPEND env "CC=${CC_filename}")

  list(APPEND args
    --extra-cflags=--target=${CMAKE_C_COMPILER_TARGET}
    --extra-ldflags=--target=${CMAKE_C_COMPILER_TARGET}
  )

  if(CMAKE_LINKER_TYPE MATCHES "LLD")
    list(APPEND args --extra-ldflags=-fuse-ld=lld)
  endif()

  list(APPEND env --modify "PATH=path_list_prepend:${CC_path}")
endif()

if(CMAKE_ASM_NASM_COMPILER)
  cmake_path(GET CMAKE_ASM_NASM_COMPILER PARENT_PATH AS_path)
  cmake_path(GET CMAKE_ASM_NASM_COMPILER FILENAME AS_filename)

  list(APPEND env "AS=${AS_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${AS_path}")
elseif(CMAKE_ASM_COMPILER)
  cmake_path(GET CMAKE_ASM_COMPILER PARENT_PATH AS_path)
  cmake_path(GET CMAKE_ASM_COMPILER FILENAME AS_filename)

  list(APPEND env "AS=${AS_filename}")

  list(APPEND args --extra-asflags=--target=${CMAKE_ASM_COMPILER_TARGET})

  list(APPEND env --modify "PATH=path_list_prepend:${AS_path}")
endif()

if(CMAKE_RC_COMPILER)
  cmake_path(GET CMAKE_RC_COMPILER PARENT_PATH RC_path)
  cmake_path(GET CMAKE_RC_COMPILER FILENAME RC_filename)

  list(APPEND env "RC=${RC_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${RC_path}")
endif()

if(CMAKE_AR)
  cmake_path(GET CMAKE_AR PARENT_PATH AR_path)
  cmake_path(GET CMAKE_AR FILENAME AR_filename)

  list(APPEND env "AR=${AR_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${AR_path}")
endif()

declare_port(
  "git:code.videolan.org/videolan/x264#stable"
  x264
  AUTOTOOLS
  BYPRODUCTS lib/${lib}
  ARGS ${args}
  ENV ${env}
  PATCHES
    patches/01-windows-clang.patch
)

add_library(x264 STATIC IMPORTED GLOBAL)

add_dependencies(x264 ${x264})

set_target_properties(
  x264
  PROPERTIES
  IMPORTED_LOCATION "${x264_PREFIX}/lib/${lib}"
)

file(MAKE_DIRECTORY "${x264_PREFIX}/include")

target_include_directories(
  x264
  INTERFACE "${x264_PREFIX}/include"
)
