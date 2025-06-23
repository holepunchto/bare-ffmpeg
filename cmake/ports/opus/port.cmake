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

message(arch="${arch}")

if(arch MATCHES "x64")
  list(APPEND args
    -DOPUS_X86_MAY_HAVE_SSE4_1=ON
    -DOPUS_X86_MAY_HAVE_AVX2=ON
  )
endif()

if(MSVC AND arch MATCHES "x64")
  list(APPEND args
    -DCMAKE_C_FLAGS=-msse4.1
  )
endif()

declare_port(
  "github:xiph/opus@v1.5.2"
  opus
  BYPRODUCTS lib/${lib}
  ARGS ${args}
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
