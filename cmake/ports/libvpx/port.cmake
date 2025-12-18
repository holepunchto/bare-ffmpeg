include_guard(GLOBAL)

if(WIN32)
  set(lib vpxmt.lib)
else()
  set(lib libvpx.a)
endif()

set(env)

set(args
  --disable-examples
  --disable-docs
  --disable-tools
  --disable-unit-tests

  --enable-static
  --disable-shared
  --enable-pic

  --enable-vp8
  --enable-vp9
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
  set(platform "win")
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
  set(arch "arm64")
  # For macOS, use darwin20+ to avoid being detected as iOS
  if(platform MATCHES "darwin")
    set(target_triplet "${arch}-darwin20-gcc")
  else()
    set(target_triplet "${arch}-${platform}-gcc")
  endif()
elseif(arch MATCHES "armv7-a|armeabi-v7a")
  set(arch "armv7")
  set(target_triplet "${arch}-${platform}-gcc")
elseif(arch MATCHES "x64|x86_64|amd64")
  set(arch "x86_64")
  if(platform MATCHES "darwin")
    set(target_triplet "${arch}-darwin20-gcc")
  else()
    set(target_triplet "${arch}-${platform}-gcc")
  endif()
elseif(arch MATCHES "x86|i386|i486|i586|i686")
  set(arch "x86")
  if(platform MATCHES "darwin")
    set(target_triplet "${arch}-darwin20-gcc")
  else()
    set(target_triplet "${arch}-${platform}-gcc")
  endif()
else()
  message(FATAL_ERROR "Unsupported architecture '${arch}'")
endif()

list(APPEND args --target=${target_triplet})

set(extra_cflags)
set(extra_ldflags)

if(APPLE)
  list(APPEND extra_cflags "-isysroot${CMAKE_OSX_SYSROOT}")
  list(APPEND extra_ldflags "-isysroot${CMAKE_OSX_SYSROOT}")
elseif(ANDROID)
  list(APPEND args --disable-runtime-cpu-detect)
  list(APPEND extra_cflags "--sysroot=${CMAKE_SYSROOT}")
  list(APPEND extra_ldflags "--sysroot=${CMAKE_SYSROOT}")
elseif(WIN32)
  list(APPEND args --disable-runtime-cpu-detect)
endif()

if(CMAKE_C_COMPILER)
  cmake_path(GET CMAKE_C_COMPILER PARENT_PATH CC_path)
  cmake_path(GET CMAKE_C_COMPILER FILENAME CC_filename)

  list(APPEND env "CC=${CC_filename}")

  if(CMAKE_C_COMPILER_TARGET)
    list(APPEND extra_cflags "--target=${CMAKE_C_COMPILER_TARGET}")
  endif()

  list(APPEND env --modify "PATH=path_list_prepend:${CC_path}")
endif()

# Add extra CFLAGS and LDFLAGS if any
if(extra_cflags)
  list(JOIN extra_cflags " " extra_cflags_str)
  list(APPEND env "CFLAGS=${extra_cflags_str}")
endif()

if(extra_ldflags)
  list(JOIN extra_ldflags " " extra_ldflags_str)
  list(APPEND env "LDFLAGS=${extra_ldflags_str}")
endif()

if(CMAKE_CXX_COMPILER)
  cmake_path(GET CMAKE_CXX_COMPILER PARENT_PATH CXX_path)
  cmake_path(GET CMAKE_CXX_COMPILER FILENAME CXX_filename)

  list(APPEND env "CXX=${CXX_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${CXX_path}")
endif()

if(CMAKE_AR)
  cmake_path(GET CMAKE_AR PARENT_PATH AR_path)
  cmake_path(GET CMAKE_AR FILENAME AR_filename)

  list(APPEND env "AR=${AR_filename}")

  list(APPEND env --modify "PATH=path_list_prepend:${AR_path}")
endif()

declare_port(
  "github:webmproject/libvpx@v1.15.0"
  libvpx
  AUTOTOOLS
  BYPRODUCTS lib/${lib}
  ARGS ${args}
  ENV ${env}
)

add_library(vpx STATIC IMPORTED GLOBAL)

add_dependencies(vpx ${libvpx})

set_target_properties(
  vpx
  PROPERTIES
  IMPORTED_LOCATION "${libvpx_PREFIX}/lib/${lib}"
)

file(MAKE_DIRECTORY "${libvpx_PREFIX}/include")

target_include_directories(
  vpx
  INTERFACE "${libvpx_PREFIX}/include"
)
