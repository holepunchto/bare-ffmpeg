include_guard(GLOBAL)

find_port(libdrm)

message(STATUS "libdrm target name: ${libdrm}")
message(STATUS "libdrm will be added as DEPENDS")

set(pkg_config_path "${libdrm_PREFIX}/lib/pkgconfig")
message(STATUS "${pkg_config_path}")

declare_port(
  "github:intel/libva#2.22.0"
  libva
  MESON
  DEPENDS ${libdrm}
  BYPRODUCTS
    lib/libva.so.2.2200.0
    lib/libva-drm.so.2.2200.0
  ARGS
    -Denable_docs=false
    -Ddisable_drm=false
  ENV
    "PKG_CONFIG_PATH=${pkg_config_path}"
)

add_library(va SHARED IMPORTED GLOBAL)
add_library(va-drm SHARED IMPORTED GLOBAL)

add_dependencies(va ${libva})
add_dependencies(va-drm ${libva})

set_target_properties(
  va
  PROPERTIES
  IMPORTED_LOCATION "${libva_PREFIX}/lib/libva.so.2.2200.0"
)

set_target_properties(
  va-drm
  PROPERTIES
  IMPORTED_LOCATION "${libva_PREFIX}/lib/libva-drm.so.2.2200.0"
)

file(MAKE_DIRECTORY "${libva_PREFIX}/include")

target_include_directories(
  va
  INTERFACE "${libva_PREFIX}/include"
)

target_include_directories(
  va-drm
  INTERFACE "${libva_PREFIX}/include"
)

target_link_libraries(va INTERFACE drm)
target_link_libraries(va-drm INTERFACE drm va)
