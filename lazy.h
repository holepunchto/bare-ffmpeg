#ifndef BARE_FFMPEG_LAZY_H
#define BARE_FFMPEG_LAZY_H

#ifdef __cplusplus
extern "C" {
#endif

// Loads the system library that a device format calls into, libpulse for `pulse` and libasound for
// `alsa`, the first time it's asked for. Returns 0, or -1 with the reason in `error` when the library
// can't be loaded. Other formats need nothing loaded and return 0.
int
bare_ffmpeg_lazy_load(const char *format, const char **error);

#ifdef __cplusplus
}
#endif

#endif // BARE_FFMPEG_LAZY_H
