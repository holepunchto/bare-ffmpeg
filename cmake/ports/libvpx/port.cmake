include_guard(GLOBAL)

if(WIN32)
  set(lib vpx.lib)
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

if(CMAKE_SYSTEM_NAME)
  set(platform ${CMAKE_SYSTEM_NAME})
else()
  set(platform ${CMAKE_HOST_SYSTEM_NAME})
endif()

string(TOLOWER "${platform}" platform)

# Detect iOS simulator
if(platform MATCHES "ios" AND CMAKE_OSX_SYSROOT MATCHES "Simulator")
  set(platform "ios-simulator")
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
  if(platform MATCHES "ios-simulator|ios")
    set(target_triplet "${arch}-darwin-gcc")
  elseif(platform MATCHES "darwin")
    set(target_triplet "${arch}-darwin20-gcc")
  elseif(platform MATCHES "win")
    set(target_triplet "${arch}-win64-vs17")
  else()
    set(target_triplet "${arch}-${platform}-gcc")
  endif()
elseif(arch MATCHES "armv7-a|armeabi-v7a")
  set(arch "armv7")
  if(platform MATCHES "ios")
    set(target_triplet "${arch}-darwin-gcc")
  else()
    set(target_triplet "${arch}-${platform}-gcc")
  endif()
elseif(arch MATCHES "x64|x86_64|amd64")
  set(arch "x86_64")
  if(platform MATCHES "ios")
    set(target_triplet "${arch}-iphonesimulator-gcc")
  elseif(platform MATCHES "darwin")
    set(target_triplet "${arch}-darwin20-gcc")
  elseif(platform MATCHES "win")
    set(target_triplet "${arch}-win64-vs17")
  else()
    set(target_triplet "${arch}-${platform}-gcc")
  endif()
elseif(arch MATCHES "x86|i386|i486|i586|i686")
  set(arch "x86")
  if(platform MATCHES "ios")
    set(target_triplet "${arch}-iphonesimulator-gcc")
  elseif(platform MATCHES "darwin")
    set(target_triplet "${arch}-darwin20-gcc")
  elseif(platform MATCHES "win")
    set(target_triplet "${arch}-win32-vs17")
  else()
    set(target_triplet "${arch}-${platform}-gcc")
  endif()
else()
  message(FATAL_ERROR "Unsupported architecture '${arch}'")
endif()

list(APPEND args --target=${target_triplet})

set(extra_cflags)
set(extra_cxxflags)
set(extra_asflags)
set(extra_ldflags)

if(APPLE)
  list(APPEND extra_cflags "-isysroot${CMAKE_OSX_SYSROOT}")
  list(APPEND extra_ldflags "-isysroot${CMAKE_OSX_SYSROOT}")
  if(platform MATCHES "ios-simulator")
    set(add_compiler_target ON)
  endif()
elseif(ANDROID)
  list(APPEND args --disable-runtime-cpu-detect)
  list(APPEND extra_cflags "--sysroot=${CMAKE_SYSROOT}")
  list(APPEND extra_cxxflags "--sysroot=${CMAKE_SYSROOT}")
  list(APPEND extra_ldflags "--sysroot=${CMAKE_SYSROOT}")
  if(arch MATCHES "arm")
    list(APPEND extra_asflags "--sysroot=${CMAKE_SYSROOT}")
  endif()
  set(add_compiler_target ON)
elseif(WIN32)
  list(APPEND args --disable-neon --disable-neon-dotprod --disable-neon-i8mm)
  list(APPEND args --disable-dependency-tracking)
  set(add_compiler_target ON)
endif()

if(add_compiler_target AND CMAKE_C_COMPILER_TARGET)
  list(APPEND extra_cflags "--target=${CMAKE_C_COMPILER_TARGET}")
  list(APPEND extra_cxxflags "--target=${CMAKE_C_COMPILER_TARGET}")
  list(APPEND extra_ldflags "--target=${CMAKE_C_COMPILER_TARGET}")
  if(arch MATCHES "arm")
    list(APPEND extra_asflags "--target=${CMAKE_C_COMPILER_TARGET}")
  endif()
endif()

# Build up PATH with all necessary directories
set(path)

if(CMAKE_C_COMPILER)
  cmake_path(GET CMAKE_C_COMPILER PARENT_PATH CC_path)

  if(ANDROID)
    # For Android, use the full path to the compiler which includes target info
    list(APPEND env "CC=${CMAKE_C_COMPILER}")
    # For ARM: Use clang as assembler instead of GNU as to support --target and --sysroot flags
    # For x86: Don't set AS, let libvpx use YASM/NASM which doesn't need these flags
    if(arch MATCHES "arm")
      list(APPEND env "AS=${CMAKE_C_COMPILER}")
    endif()
  else()
    cmake_path(GET CMAKE_C_COMPILER FILENAME CC_filename)
    list(APPEND env "CC=${CC_filename}")
    list(APPEND path "${CC_path}")
  endif()
endif()

# Add extra CFLAGS, CXXFLAGS, ASFLAGS and LDFLAGS if any
if(extra_cflags)
  list(JOIN extra_cflags " " extra_cflags_str)
  list(APPEND env "CFLAGS=${extra_cflags_str}")
endif()

if(extra_cxxflags)
  list(JOIN extra_cxxflags " " extra_cxxflags_str)
  list(APPEND env "CXXFLAGS=${extra_cxxflags_str}")
endif()

if(extra_asflags)
  list(JOIN extra_asflags " " extra_asflags_str)
  list(APPEND env "ASFLAGS=${extra_asflags_str}")
endif()

if(extra_ldflags)
  list(JOIN extra_ldflags " " extra_ldflags_str)
  list(APPEND env "LDFLAGS=${extra_ldflags_str}")
endif()

if(CMAKE_CXX_COMPILER)
  if(ANDROID)
    # For Android, use the full path to the compiler which includes target info
    list(APPEND env "CXX=${CMAKE_CXX_COMPILER}")
  else()
    cmake_path(GET CMAKE_CXX_COMPILER PARENT_PATH CXX_path)
    cmake_path(GET CMAKE_CXX_COMPILER FILENAME CXX_filename)
    list(APPEND env "CXX=${CXX_filename}")
    list(APPEND path "${CXX_path}")
  endif()
endif()

if(CMAKE_AR)
  if(ANDROID)
    # For Android, use the full path to the archiver
    list(APPEND env "AR=${CMAKE_AR}")
  elseif(WIN32)
    # For Windows, use llvm-ar instead of llvm-lib to support GCC-style flags (-crs)
    cmake_path(GET CMAKE_AR PARENT_PATH AR_path)
    # Replace llvm-lib with llvm-ar
    list(APPEND env "AR=llvm-ar.exe")
    list(APPEND path "${AR_path}")
  else()
    cmake_path(GET CMAKE_AR PARENT_PATH AR_path)
    cmake_path(GET CMAKE_AR FILENAME AR_filename)
    list(APPEND env "AR=${AR_filename}")
    list(APPEND path "${AR_path}")
  endif()
endif()

# Add system PATH
foreach(part "$ENV{PATH}")
  cmake_path(NORMAL_PATH part)
  list(APPEND path "${part}")
endforeach()

# Remove duplicates and transform Windows paths for bash
list(REMOVE_DUPLICATES path)

if(CMAKE_HOST_WIN32)
  list(TRANSFORM path REPLACE "([A-Z]):" "/\\1")
endif()

# Join path and add to environment
list(JOIN path ":" path)
list(APPEND env "PATH=${path}")

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
