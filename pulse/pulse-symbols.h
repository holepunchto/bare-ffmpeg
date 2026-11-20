#ifndef BARE_FFMPEG_PULSE_SYMBOLS_H
#define BARE_FFMPEG_PULSE_SYMBOLS_H

// Every libpulse function FFmpeg's pulse device calls. Regenerate against a new
// FFmpeg with, from its source tree:
//
//   grep -ohE '\bpa_[a-z0-9_]+ *\(' libavdevice/pulse_audio_*.[ch] \
//     | tr -d '( ' | sort -u | grep -v '^pa_state_cb$'
//
// pa_state_cb is FFmpeg's own callback, not libpulse's.

#define BARE_FFMPEG_PULSE_SYMBOLS(V) \
  V(pa_channel_map_init_extend) \
  V(pa_channel_map_valid) \
  V(pa_context_connect) \
  V(pa_context_disconnect) \
  V(pa_context_errno) \
  V(pa_context_get_server_info) \
  V(pa_context_get_sink_info_by_name) \
  V(pa_context_get_sink_info_list) \
  V(pa_context_get_sink_input_info) \
  V(pa_context_get_source_info_list) \
  V(pa_context_get_state) \
  V(pa_context_new) \
  V(pa_context_set_sink_input_mute) \
  V(pa_context_set_sink_input_volume) \
  V(pa_context_set_state_callback) \
  V(pa_context_set_subscribe_callback) \
  V(pa_context_subscribe) \
  V(pa_context_unref) \
  V(pa_cvolume_avg) \
  V(pa_cvolume_set) \
  V(pa_frame_size) \
  V(pa_mainloop_free) \
  V(pa_mainloop_get_api) \
  V(pa_mainloop_iterate) \
  V(pa_mainloop_new) \
  V(pa_operation_get_state) \
  V(pa_operation_unref) \
  V(pa_sample_spec_valid) \
  V(pa_stream_connect_playback) \
  V(pa_stream_connect_record) \
  V(pa_stream_cork) \
  V(pa_stream_disconnect) \
  V(pa_stream_drop) \
  V(pa_stream_flush) \
  V(pa_stream_get_buffer_attr) \
  V(pa_stream_get_index) \
  V(pa_stream_get_latency) \
  V(pa_stream_get_sample_spec) \
  V(pa_stream_get_state) \
  V(pa_stream_is_corked) \
  V(pa_stream_new) \
  V(pa_stream_peek) \
  V(pa_stream_set_latency_update_callback) \
  V(pa_stream_set_overflow_callback) \
  V(pa_stream_set_read_callback) \
  V(pa_stream_set_state_callback) \
  V(pa_stream_set_underflow_callback) \
  V(pa_stream_set_write_callback) \
  V(pa_stream_unref) \
  V(pa_stream_update_timing_info) \
  V(pa_stream_writable_size) \
  V(pa_stream_write) \
  V(pa_strerror) \
  V(pa_sw_cvolume_multiply_scalar) \
  V(pa_sw_volume_divide) \
  V(pa_sw_volume_multiply) \
  V(pa_threaded_mainloop_free) \
  V(pa_threaded_mainloop_get_api) \
  V(pa_threaded_mainloop_lock) \
  V(pa_threaded_mainloop_new) \
  V(pa_threaded_mainloop_signal) \
  V(pa_threaded_mainloop_start) \
  V(pa_threaded_mainloop_stop) \
  V(pa_threaded_mainloop_unlock) \
  V(pa_threaded_mainloop_wait)

#endif // BARE_FFMPEG_PULSE_SYMBOLS_H
