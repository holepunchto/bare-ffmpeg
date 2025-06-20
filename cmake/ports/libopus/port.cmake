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
  libopus
  BYPRODUCTS lib/${lib}
  ARGS ${args}
)

add_library(libopus STATIC IMPORTED GLOBAL)

add_dependencies(libopus ${libopus})

set_target_properties(
  libopus
  PROPERTIES
  IMPORTED_LOCATION "${libopus_PREFIX}/lib/${lib}"
)

file(MAKE_DIRECTORY "${libopus_PREFIX}/include")

target_include_directories(
  libopus
  INTERFACE "${libopus_PREFIX}/include"
)
