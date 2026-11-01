include_guard(GLOBAL)

# FFmpeg loads the Vulkan loader at run time, so only the headers are needed to
# build it, and at a newer version than the distributions ship.
declare_port(
  "github:KhronosGroup/Vulkan-Headers#vulkan-sdk-1.4.363.0"
  vulkan_headers
  CMAKE
  BYPRODUCTS include/vulkan/vulkan.h
  ARGS
    -DVULKAN_HEADERS_ENABLE_TESTS=OFF
    -DVULKAN_HEADERS_ENABLE_INSTALL=ON
)
