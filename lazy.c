// FFmpeg's pulse and alsa devices call libpulse and libasound, which a system may not have, so they
// aren't linked. Every pa_* and snd_* function FFmpeg calls is defined here instead, as a stub that
// jumps through a pointer, and the pointers are set with dlopen() and dlsym() when the format is first
// asked for. Until then they point at bare_ffmpeg_lazy__missing. The functions are read from
// libavdevice at build time, see cmake/lazy.cmake.

#include <dlfcn.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "lazy-symbols.h"
#include "lazy.h"

enum {
  bare_ffmpeg_lazy_pulse,
  bare_ffmpeg_lazy_alsa,
};

static void
bare_ffmpeg_lazy__missing(void) {
  fprintf(stderr, "bare-ffmpeg: called into libpulse or libasound before it was loaded\n");
  abort();
}

// clang-format off
#if defined(__x86_64__)
#if defined(__CET__)
#define BARE_FFMPEG_LAZY_LANDING "endbr64\n"
#else
#define BARE_FFMPEG_LAZY_LANDING ""
#endif
#define BARE_FFMPEG_LAZY_JUMP(symbol) \
  BARE_FFMPEG_LAZY_LANDING \
  "jmp *bare_ffmpeg_lazy__" #symbol "(%rip)\n"
#elif defined(__aarch64__)
#if defined(__ARM_FEATURE_BTI_DEFAULT)
#define BARE_FFMPEG_LAZY_LANDING "bti c\n"
#else
#define BARE_FFMPEG_LAZY_LANDING ""
#endif
#define BARE_FFMPEG_LAZY_JUMP(symbol) \
  BARE_FFMPEG_LAZY_LANDING \
  "adrp x16, bare_ffmpeg_lazy__" #symbol "\n" \
  "ldr x16, [x16, #:lo12:bare_ffmpeg_lazy__" #symbol "]\n" \
  "br x16\n"
#else
#error "Unsupported architecture"
#endif

// The stubs are hidden, so they never stand in for the real functions of another module in the process
#define X(library, symbol) \
  __attribute__((used, visibility("hidden"))) void *bare_ffmpeg_lazy__##symbol = (void *) bare_ffmpeg_lazy__missing; \
  __asm__( \
    ".pushsection .text\n" \
    ".globl " #symbol "\n" \
    ".hidden " #symbol "\n" \
    ".type " #symbol ", %function\n" \
    ".p2align 4\n" \
    #symbol ":\n" \
    BARE_FFMPEG_LAZY_JUMP(symbol) \
    ".size " #symbol ", .-" #symbol "\n" \
    ".popsection\n" \
  );
// clang-format on

BARE_FFMPEG_LAZY_SYMBOLS(X)

#undef X

static int bare_ffmpeg_lazy__status[2] = {-1, -1};

static char bare_ffmpeg_lazy__error[2][256];

static void
bare_ffmpeg_lazy__fail(int library) {
  const char *reason = dlerror();

  snprintf(bare_ffmpeg_lazy__error[library], sizeof(bare_ffmpeg_lazy__error[library]), "%s", reason ? reason : "unknown error");
}

static void
bare_ffmpeg_lazy__open(int library) {
  static const char *names[] = {"libpulse.so.0", "libasound.so.2"};

  void *handle = dlopen(names[library], RTLD_NOW | RTLD_LOCAL);

  if (handle == NULL) {
    bare_ffmpeg_lazy__fail(library);

    return;
  }

  // Look up all of the library's functions before pointing any stub at them
#define X(lib, symbol) \
  void *symbol = NULL; \
  if (library == bare_ffmpeg_lazy_##lib) { \
    symbol = dlsym(handle, #symbol); \
    if (symbol == NULL) { \
      bare_ffmpeg_lazy__fail(library); \
      dlclose(handle); \
      return; \
    } \
  }

  BARE_FFMPEG_LAZY_SYMBOLS(X)

#undef X

#define X(lib, symbol) \
  if (library == bare_ffmpeg_lazy_##lib) __atomic_store_n(&bare_ffmpeg_lazy__##symbol, symbol, __ATOMIC_RELEASE);

  BARE_FFMPEG_LAZY_SYMBOLS(X)

#undef X

  bare_ffmpeg_lazy__status[library] = 0;
}

static void
bare_ffmpeg_lazy__open_pulse(void) {
  bare_ffmpeg_lazy__open(bare_ffmpeg_lazy_pulse);
}

static void
bare_ffmpeg_lazy__open_alsa(void) {
  bare_ffmpeg_lazy__open(bare_ffmpeg_lazy_alsa);
}

int
bare_ffmpeg_lazy_load(const char *format, const char **error) {
  static pthread_once_t guards[] = {PTHREAD_ONCE_INIT, PTHREAD_ONCE_INIT};

  int library;

  if (strcmp(format, "pulse") == 0) {
    library = bare_ffmpeg_lazy_pulse;
    pthread_once(&guards[library], bare_ffmpeg_lazy__open_pulse);
  } else if (strcmp(format, "alsa") == 0) {
    library = bare_ffmpeg_lazy_alsa;
    pthread_once(&guards[library], bare_ffmpeg_lazy__open_alsa);
  } else {
    return 0;
  }

  if (bare_ffmpeg_lazy__status[library] != 0) *error = bare_ffmpeg_lazy__error[library];

  return bare_ffmpeg_lazy__status[library];
}
