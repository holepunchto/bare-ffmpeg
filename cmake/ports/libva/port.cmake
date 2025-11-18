include_guard(GLOBAL)

find_port(libdrm)

declare_port(
  "github:intel/libva#2.22.0"
  libva
  MESON
  DEPENDS ${libdrm}
  BYPRODUCTS
    lib/libva.so
    # lib/libva-drm.a
  ARGS
    -Denable_docs=false
    -Ddisable_drm=false
)

add_library(va STATIC IMPORTED GLOBAL)
# add_library(va-drm STATIC IMPORTED GLOBAL)

add_dependencies(va ${libva})
# add_dependencies(va-drm ${libva})

set_target_properties(
  va
  PROPERTIES
  IMPORTED_LOCATION "${libva_PREFIX}/lib/libva.so"
)

# set_target_properties(
#   va-drm
#   PROPERTIES
#   IMPORTED_LOCATION "${libva_PREFIX}/lib/libva-drm.a"
# )

file(MAKE_DIRECTORY "${libva_PREFIX}/include")

target_include_directories(
  va
  INTERFACE "${libva_PREFIX}/include"
)

# target_include_directories(
#   va-drm
#   INTERFACE "${libva_PREFIX}/include"
# )

# target_link_libraries(va INTERFACE drm)
# target_link_libraries(va-drm INTERFACE drm va)
