#ifndef BARE_FFMPEG_PULSE_H
#define BARE_FFMPEG_PULSE_H

#ifdef __cplusplus
extern "C" {
#endif

// Loads libpulse and fills the pointers behind FFmpeg's pa_* calls. Returns
// NULL once they are usable, or why they are not. Loads at most once; later
// calls repeat the first result.
const char *
bare_ffmpeg_pulse_load(void);

#ifdef __cplusplus
}
#endif

#endif // BARE_FFMPEG_PULSE_H
