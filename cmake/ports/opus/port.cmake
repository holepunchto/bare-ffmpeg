include_guard(GLOBAL)

if(WIN32)
  set(lib opus.lib)
else()
  set(lib libopus.a)
endif()

set(args
  -DBUILD_SHARED_LIBS=OFF
  -DBUILD_TESTING=OFF
)

if(WIN32)
  list(APPEND args -DOPUS_DISABLE_INTRINSICS=ON)
endif()

declare_port(
  "github:xiph/opus@v1.5.2"
  opus
  BYPRODUCTS lib/${lib}
  ARGS ${args}
  PATCHES
    patches/01-windows-clang.patch
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
