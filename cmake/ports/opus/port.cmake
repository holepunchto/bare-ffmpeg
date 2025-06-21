include_guard(GLOBAL)

if(WIN32)
  set(lib opus.lib)
else()
  set(lib libopus.a)
endif()

set(args
  -DCMAKE_POLICY_VERSION_MINIMUM=3.5
  -DBUILD_SHARED_LIBS=OFF
  -DOPUS_BUILD_PROGRAMS=OFF
  -DOPUS_BUILD_TESTING=OFF
)

bare_arch(arch)

if(arch MATCHES "arm64")
  list(APPEND args
    -DOPUS_USE_NEON=ON
  )
endif()

set(OPUS_X86_MAY_HAVE_SSE4_1 ON CACHE BOOL "Enable SSE4.1 runtime detection")
set(OPUS_X86_MAY_HAVE_AVX2 ON CACHE BOOL "Enable AVX2 runtime detection")

if(MSVC AND CMAKE_C_COMPILER_ID MATCHES "Clang" AND arch MATCHES "x64")
  set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -msse4.1")
endif()

declare_port(
  "github:xiph/opus#c0eb2ca"
  opus
  BYPRODUCTS lib/${lib}
  ARGS ${args}
  # PATCHES
  #   patches/01-windows-clang.patch
)

add_library(opus STATIC IMPORTED GLOBAL)

add_dependencies(opus ${opus})

set_target_properties(
  opus
  PROPERTIES
  IMPORTED_LOCATION "${opus_PREFIX}/lib/${lib}"
)

file(MAKE_DIRECTORY "${opus_PREFIX}/include")

target_include_directories(
  opus
  INTERFACE "${opus_PREFIX}/include"
)
