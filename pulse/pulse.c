#include <dlfcn.h>
#include <stdbool.h>
#include <stdio.h>

// The real declarations: this file defines the pointers, so it must not include
// pulse-wrap.h, which would rename them.
#include <pulse/error.h>
#include <pulse/pulseaudio.h>

#include "pulse-symbols.h"
#include "pulse.h"

#define BARE_FFMPEG_PULSE_LIBRARY "libpulse.so.0"

#define V(name) __typeof__(&name) bare_##name = NULL;
BARE_FFMPEG_PULSE_SYMBOLS(V)
#undef V

static char bare_ffmpeg_pulse_error[256] = {0};

const char *
bare_ffmpeg_pulse_load(void) {
  static bool loaded = false;

  if (loaded) {
    return bare_ffmpeg_pulse_error[0] == '\0' ? NULL : bare_ffmpeg_pulse_error;
  }

  loaded = true;

  // Never closed: libpulse starts threads that outlive this call.
  void *library = dlopen(BARE_FFMPEG_PULSE_LIBRARY, RTLD_LAZY | RTLD_LOCAL);

  if (library == NULL) {
    snprintf(bare_ffmpeg_pulse_error, sizeof(bare_ffmpeg_pulse_error), "%s", dlerror());

    return bare_ffmpeg_pulse_error;
  }

#define V(name) \
  bare_##name = (__typeof__(&name)) dlsym(library, #name); \
\
  if (bare_##name == NULL) { \
    snprintf( \
      bare_ffmpeg_pulse_error, \
      sizeof(bare_ffmpeg_pulse_error), \
      BARE_FFMPEG_PULSE_LIBRARY " has no symbol '%s'", \
      #name \
    ); \
\
    return bare_ffmpeg_pulse_error; \
  }

  BARE_FFMPEG_PULSE_SYMBOLS(V)
#undef V

  return NULL;
}
