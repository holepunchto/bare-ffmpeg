include_guard(GLOBAL)

declare_port(
  "git:code.videolan.org/videolan/x264#stable"
  x264
  AUTOTOOLS
  ARGS
    --enable-static
    --disable-cli
    --enable-strip
  BYPRODUCTS lib/libx264.a
)

add_library(x264 STATIC IMPORTED GLOBAL)

add_dependencies(x264 ${x264})

set_target_properties(
  x264
  PROPERTIES
  IMPORTED_LOCATION "${x264_PREFIX}/lib/libx264.a"
)

file(MAKE_DIRECTORY "${x264_PREFIX}/include")

target_include_directories(
  x264
  INTERFACE "${x264_PREFIX}/include"
)
