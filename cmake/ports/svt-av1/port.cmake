include_guard(GLOBAL)

if(WIN32)
  set(lib SvtAv1Enc.lib)
else()
  set(lib libSvtAv1Enc.a)
endif()

declare_port(
  "gitlab:AOMediaCodec/SVT-AV1@2.3.0"
  svt-av1
  BYPRODUCTS lib/${lib}
  ARGS
    -DBUILD_SHARED_LIBS=OFF
    -DBUILD_TESTING=OFF
    -DBUILD_APPS=OFF
    -DCMAKE_POLICY_VERSION_MINIMUM=3.5
)

add_library(svt-av1 STATIC IMPORTED GLOBAL)

add_dependencies(svt-av1 ${svt-av1})

set_target_properties(
  svt-av1
  PROPERTIES
  IMPORTED_LOCATION "${svt-av1_PREFIX}/lib/${lib}"
)

file(MAKE_DIRECTORY "${svt-av1_PREFIX}/include")

target_include_directories(
  svt-av1
  INTERFACE "${svt-av1_PREFIX}/include"
)
