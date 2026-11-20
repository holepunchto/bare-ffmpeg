// Included by FFmpeg's libavdevice/pulse_audio_common.h, which every pulse
// source includes before any code. From there on, a pa_* call in libavdevice
// goes through a pointer this addon fills with dlsym() instead of a symbol the
// dynamic linker has to resolve when the addon loads. A prebuild built with
// --enable-libpulse but not linked against libpulse would otherwise die with
// "symbol lookup error" the first time the pulse device is opened.
//
// Each pair below declares the pointer with the type libpulse's own header
// gives the function, then redirects the name. No signature is repeated here,
// so a change in libpulse is a compile error rather than a wrong call.
//
// pulse/pulse.c defines the pointers and must not include this file.

#ifndef BARE_FFMPEG_PULSE_WRAP_H
#define BARE_FFMPEG_PULSE_WRAP_H

#include <pulse/error.h>
#include <pulse/pulseaudio.h>

extern __typeof__(&pa_channel_map_init_extend) bare_pa_channel_map_init_extend;
#define pa_channel_map_init_extend (*bare_pa_channel_map_init_extend)

extern __typeof__(&pa_channel_map_valid) bare_pa_channel_map_valid;
#define pa_channel_map_valid (*bare_pa_channel_map_valid)

extern __typeof__(&pa_context_connect) bare_pa_context_connect;
#define pa_context_connect (*bare_pa_context_connect)

extern __typeof__(&pa_context_disconnect) bare_pa_context_disconnect;
#define pa_context_disconnect (*bare_pa_context_disconnect)

extern __typeof__(&pa_context_errno) bare_pa_context_errno;
#define pa_context_errno (*bare_pa_context_errno)

extern __typeof__(&pa_context_get_server_info) bare_pa_context_get_server_info;
#define pa_context_get_server_info (*bare_pa_context_get_server_info)

extern __typeof__(&pa_context_get_sink_info_by_name) bare_pa_context_get_sink_info_by_name;
#define pa_context_get_sink_info_by_name (*bare_pa_context_get_sink_info_by_name)

extern __typeof__(&pa_context_get_sink_info_list) bare_pa_context_get_sink_info_list;
#define pa_context_get_sink_info_list (*bare_pa_context_get_sink_info_list)

extern __typeof__(&pa_context_get_sink_input_info) bare_pa_context_get_sink_input_info;
#define pa_context_get_sink_input_info (*bare_pa_context_get_sink_input_info)

extern __typeof__(&pa_context_get_source_info_list) bare_pa_context_get_source_info_list;
#define pa_context_get_source_info_list (*bare_pa_context_get_source_info_list)

extern __typeof__(&pa_context_get_state) bare_pa_context_get_state;
#define pa_context_get_state (*bare_pa_context_get_state)

extern __typeof__(&pa_context_new) bare_pa_context_new;
#define pa_context_new (*bare_pa_context_new)

extern __typeof__(&pa_context_set_sink_input_mute) bare_pa_context_set_sink_input_mute;
#define pa_context_set_sink_input_mute (*bare_pa_context_set_sink_input_mute)

extern __typeof__(&pa_context_set_sink_input_volume) bare_pa_context_set_sink_input_volume;
#define pa_context_set_sink_input_volume (*bare_pa_context_set_sink_input_volume)

extern __typeof__(&pa_context_set_state_callback) bare_pa_context_set_state_callback;
#define pa_context_set_state_callback (*bare_pa_context_set_state_callback)

extern __typeof__(&pa_context_set_subscribe_callback) bare_pa_context_set_subscribe_callback;
#define pa_context_set_subscribe_callback (*bare_pa_context_set_subscribe_callback)

extern __typeof__(&pa_context_subscribe) bare_pa_context_subscribe;
#define pa_context_subscribe (*bare_pa_context_subscribe)

extern __typeof__(&pa_context_unref) bare_pa_context_unref;
#define pa_context_unref (*bare_pa_context_unref)

extern __typeof__(&pa_cvolume_avg) bare_pa_cvolume_avg;
#define pa_cvolume_avg (*bare_pa_cvolume_avg)

extern __typeof__(&pa_cvolume_set) bare_pa_cvolume_set;
#define pa_cvolume_set (*bare_pa_cvolume_set)

extern __typeof__(&pa_frame_size) bare_pa_frame_size;
#define pa_frame_size (*bare_pa_frame_size)

extern __typeof__(&pa_mainloop_free) bare_pa_mainloop_free;
#define pa_mainloop_free (*bare_pa_mainloop_free)

extern __typeof__(&pa_mainloop_get_api) bare_pa_mainloop_get_api;
#define pa_mainloop_get_api (*bare_pa_mainloop_get_api)

extern __typeof__(&pa_mainloop_iterate) bare_pa_mainloop_iterate;
#define pa_mainloop_iterate (*bare_pa_mainloop_iterate)

extern __typeof__(&pa_mainloop_new) bare_pa_mainloop_new;
#define pa_mainloop_new (*bare_pa_mainloop_new)

extern __typeof__(&pa_operation_get_state) bare_pa_operation_get_state;
#define pa_operation_get_state (*bare_pa_operation_get_state)

extern __typeof__(&pa_operation_unref) bare_pa_operation_unref;
#define pa_operation_unref (*bare_pa_operation_unref)

extern __typeof__(&pa_sample_spec_valid) bare_pa_sample_spec_valid;
#define pa_sample_spec_valid (*bare_pa_sample_spec_valid)

extern __typeof__(&pa_stream_connect_playback) bare_pa_stream_connect_playback;
#define pa_stream_connect_playback (*bare_pa_stream_connect_playback)

extern __typeof__(&pa_stream_connect_record) bare_pa_stream_connect_record;
#define pa_stream_connect_record (*bare_pa_stream_connect_record)

extern __typeof__(&pa_stream_cork) bare_pa_stream_cork;
#define pa_stream_cork (*bare_pa_stream_cork)

extern __typeof__(&pa_stream_disconnect) bare_pa_stream_disconnect;
#define pa_stream_disconnect (*bare_pa_stream_disconnect)

extern __typeof__(&pa_stream_drop) bare_pa_stream_drop;
#define pa_stream_drop (*bare_pa_stream_drop)

extern __typeof__(&pa_stream_flush) bare_pa_stream_flush;
#define pa_stream_flush (*bare_pa_stream_flush)

extern __typeof__(&pa_stream_get_buffer_attr) bare_pa_stream_get_buffer_attr;
#define pa_stream_get_buffer_attr (*bare_pa_stream_get_buffer_attr)

extern __typeof__(&pa_stream_get_index) bare_pa_stream_get_index;
#define pa_stream_get_index (*bare_pa_stream_get_index)

extern __typeof__(&pa_stream_get_latency) bare_pa_stream_get_latency;
#define pa_stream_get_latency (*bare_pa_stream_get_latency)

extern __typeof__(&pa_stream_get_sample_spec) bare_pa_stream_get_sample_spec;
#define pa_stream_get_sample_spec (*bare_pa_stream_get_sample_spec)

extern __typeof__(&pa_stream_get_state) bare_pa_stream_get_state;
#define pa_stream_get_state (*bare_pa_stream_get_state)

extern __typeof__(&pa_stream_is_corked) bare_pa_stream_is_corked;
#define pa_stream_is_corked (*bare_pa_stream_is_corked)

extern __typeof__(&pa_stream_new) bare_pa_stream_new;
#define pa_stream_new (*bare_pa_stream_new)

extern __typeof__(&pa_stream_peek) bare_pa_stream_peek;
#define pa_stream_peek (*bare_pa_stream_peek)

extern __typeof__(&pa_stream_set_latency_update_callback) bare_pa_stream_set_latency_update_callback;
#define pa_stream_set_latency_update_callback (*bare_pa_stream_set_latency_update_callback)

extern __typeof__(&pa_stream_set_overflow_callback) bare_pa_stream_set_overflow_callback;
#define pa_stream_set_overflow_callback (*bare_pa_stream_set_overflow_callback)

extern __typeof__(&pa_stream_set_read_callback) bare_pa_stream_set_read_callback;
#define pa_stream_set_read_callback (*bare_pa_stream_set_read_callback)

extern __typeof__(&pa_stream_set_state_callback) bare_pa_stream_set_state_callback;
#define pa_stream_set_state_callback (*bare_pa_stream_set_state_callback)

extern __typeof__(&pa_stream_set_underflow_callback) bare_pa_stream_set_underflow_callback;
#define pa_stream_set_underflow_callback (*bare_pa_stream_set_underflow_callback)

extern __typeof__(&pa_stream_set_write_callback) bare_pa_stream_set_write_callback;
#define pa_stream_set_write_callback (*bare_pa_stream_set_write_callback)

extern __typeof__(&pa_stream_unref) bare_pa_stream_unref;
#define pa_stream_unref (*bare_pa_stream_unref)

extern __typeof__(&pa_stream_update_timing_info) bare_pa_stream_update_timing_info;
#define pa_stream_update_timing_info (*bare_pa_stream_update_timing_info)

extern __typeof__(&pa_stream_writable_size) bare_pa_stream_writable_size;
#define pa_stream_writable_size (*bare_pa_stream_writable_size)

extern __typeof__(&pa_stream_write) bare_pa_stream_write;
#define pa_stream_write (*bare_pa_stream_write)

extern __typeof__(&pa_strerror) bare_pa_strerror;
#define pa_strerror (*bare_pa_strerror)

extern __typeof__(&pa_sw_cvolume_multiply_scalar) bare_pa_sw_cvolume_multiply_scalar;
#define pa_sw_cvolume_multiply_scalar (*bare_pa_sw_cvolume_multiply_scalar)

extern __typeof__(&pa_sw_volume_divide) bare_pa_sw_volume_divide;
#define pa_sw_volume_divide (*bare_pa_sw_volume_divide)

extern __typeof__(&pa_sw_volume_multiply) bare_pa_sw_volume_multiply;
#define pa_sw_volume_multiply (*bare_pa_sw_volume_multiply)

extern __typeof__(&pa_threaded_mainloop_free) bare_pa_threaded_mainloop_free;
#define pa_threaded_mainloop_free (*bare_pa_threaded_mainloop_free)

extern __typeof__(&pa_threaded_mainloop_get_api) bare_pa_threaded_mainloop_get_api;
#define pa_threaded_mainloop_get_api (*bare_pa_threaded_mainloop_get_api)

extern __typeof__(&pa_threaded_mainloop_lock) bare_pa_threaded_mainloop_lock;
#define pa_threaded_mainloop_lock (*bare_pa_threaded_mainloop_lock)

extern __typeof__(&pa_threaded_mainloop_new) bare_pa_threaded_mainloop_new;
#define pa_threaded_mainloop_new (*bare_pa_threaded_mainloop_new)

extern __typeof__(&pa_threaded_mainloop_signal) bare_pa_threaded_mainloop_signal;
#define pa_threaded_mainloop_signal (*bare_pa_threaded_mainloop_signal)

extern __typeof__(&pa_threaded_mainloop_start) bare_pa_threaded_mainloop_start;
#define pa_threaded_mainloop_start (*bare_pa_threaded_mainloop_start)

extern __typeof__(&pa_threaded_mainloop_stop) bare_pa_threaded_mainloop_stop;
#define pa_threaded_mainloop_stop (*bare_pa_threaded_mainloop_stop)

extern __typeof__(&pa_threaded_mainloop_unlock) bare_pa_threaded_mainloop_unlock;
#define pa_threaded_mainloop_unlock (*bare_pa_threaded_mainloop_unlock)

extern __typeof__(&pa_threaded_mainloop_wait) bare_pa_threaded_mainloop_wait;
#define pa_threaded_mainloop_wait (*bare_pa_threaded_mainloop_wait)

#endif // BARE_FFMPEG_PULSE_WRAP_H
