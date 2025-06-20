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

set(OPUS_X86_MAY_HAVE_SSE4_1 ON CACHE BOOL "Enable SSE4.1 runtime detection")
set(OPUS_X86_MAY_HAVE_AVX2 ON CACHE BOOL "Enable AVX2 runtime detection")

if(OPUS_CPU_X86 OR OPUS_CPU_X64)
    if(OPUS_X86_MAY_HAVE_SSE4_1)
        target_compile_definitions(opus PRIVATE OPUS_X86_MAY_HAVE_SSE4_1)
        if(NOT MSVC)
            set_source_files_properties(${sse4_sources}
                PROPERTIES COMPILE_FLAGS -msse4.1)
        endif()
    endif()

    if(OPUS_X86_MAY_HAVE_AVX2)
        target_compile_definitions(opus PRIVATE OPUS_X86_MAY_HAVE_AVX2)
        if(MSVC)
            set_source_files_properties(${avx2_sources}
                PROPERTIES COMPILE_FLAGS "/arch:AVX2")
        else()
            set_source_files_properties(${avx2_sources}
                PROPERTIES COMPILE_FLAGS "-mavx2 -mfma -mavx")
        endif()
    endif()
endif()

if(MSVC AND CMAKE_CL_64)
    target_compile_definitions(opus PRIVATE __SSE__=1 __SSE2__=1)
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
