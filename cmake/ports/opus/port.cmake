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
