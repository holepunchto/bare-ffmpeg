include_guard(GLOBAL)

declare_port(
  "git:gitlab.freedesktop.org/mesa/drm#libdrm-2.4.128"
  libdrm
  MESON
  BYPRODUCTS
    lib/libdrm.a
  ARGS
    -Dcairo-tests=disabled
    -Dman-pages=disabled
    -Dvalgrind=disabled
    -Dinstall-test-programs=false
    -Dudev=true
)

add_library(drm STATIC IMPORTED GLOBAL)

add_dependencies(drm ${libdrm})

set_target_properties(
  drm
  PROPERTIES
  IMPORTED_LOCATION "${libdrm_PREFIX}/lib/libdrm.a"
)

file(MAKE_DIRECTORY "${libdrm_PREFIX}/include")

target_include_directories(
  drm
  INTERFACE "${libdrm_PREFIX}/include"
)
