#include <optional>
#include <tuple>
#include <vector>

#include <assert.h>
#include <bare.h>
#include <js.h>
#include <jstl.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavcodec/codec.h>
#include <libavcodec/codec_id.h>
#include <libavcodec/codec_par.h>
#include <libavcodec/packet.h>
#include <libavdevice/avdevice.h>
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersink.h>
#include <libavfilter/buffersrc.h>
#include <libavformat/avformat.h>
#include <libavformat/avio.h>
#include <libavutil/audio_fifo.h>
#include <libavutil/channel_layout.h>
#include <libavutil/dict.h>
#include <libavutil/error.h>
#include <libavutil/frame.h>
#include <libavutil/imgutils.h>
#include <libavutil/log.h>
#include <libavutil/mathematics.h>
#include <libavutil/mem.h>
#include <libavutil/pixfmt.h>
#include <libavutil/rational.h>
#include <libavutil/samplefmt.h>
#include <libswresample/swresample.h>
#include <libswscale/swscale.h>
}

using bare_ffmpeg_io_context_write_cb_t = js_function_t<void, js_arraybuffer_t>;
using bare_ffmpeg_io_context_read_cb_t = js_function_t<int32_t, js_arraybuffer_t, int32_t>;
using bare_ffmpeg_io_context_seek_cb_t = js_function_t<int64_t, int64_t, int>;

typedef struct {
  AVIOContext *handle;

  js_env_t *env;

  js_persistent_t<bare_ffmpeg_io_context_write_cb_t> on_write;
  js_persistent_t<bare_ffmpeg_io_context_read_cb_t> on_read;
  js_persistent_t<bare_ffmpeg_io_context_seek_cb_t> on_seek;
} bare_ffmpeg_io_context_t;

typedef struct {
  const AVOutputFormat *handle;
} bare_ffmpeg_output_format_t;

typedef struct {
  const AVInputFormat *handle;
} bare_ffmpeg_input_format_t;

typedef struct {
  AVFormatContext *handle;
} bare_ffmpeg_format_context_t;

typedef struct {
  AVStream *handle;
} bare_ffmpeg_stream_t;

typedef struct {
  const AVCodec *handle;
} bare_ffmpeg_codec_t;

typedef struct {
  AVCodecParameters *handle;
} bare_ffmpeg_codec_parameters_t;

typedef struct {
  AVCodecContext *handle;
} bare_ffmpeg_codec_context_t;

typedef struct {
  AVChannelLayout handle;
} bare_ffmpeg_channel_layout_t;

typedef struct {
  AVFrame *handle;
} bare_ffmpeg_frame_t;

typedef struct {
  AVPacket *handle;
} bare_ffmpeg_packet_t;

typedef struct {
  struct SwsContext *handle;
} bare_ffmpeg_scaler_t;

typedef struct {
  struct AVDictionary *handle;
} bare_ffmpeg_dictionary_t;

typedef struct {
  struct SwrContext *handle;
} bare_ffmpeg_resampler_t;

typedef struct {
  AVAudioFifo *handle;
} bare_ffmpeg_audio_fifo_t;

typedef struct {
  AVPacketSideData *handle;
} bare_ffmpeg_side_data_t;

typedef struct {
  const AVFilter *handle;
} bare_ffmpeg_filter_t;

typedef struct {
  AVFilterContext *handle;
} bare_ffmpeg_filter_context_t;

typedef struct {
  AVFilterGraph *handle;
} bare_ffmpeg_filter_graph_t;

typedef struct {
  AVFilterInOut *handle;
} bare_ffmpeg_filter_inout_t;

static uv_once_t bare_ffmpeg__init_guard = UV_ONCE_INIT;

static void
bare_ffmpeg__on_init(void) {
  av_log_set_level(AV_LOG_ERROR);

  avdevice_register_all();
}

static int32_t
bare_ffmpeg_log_get_level(js_env_t *) {
  return av_log_get_level();
}

static void
bare_ffmpeg_log_set_level(js_env_t *, int32_t level) {
  av_log_set_level(level);
}

static int
bare_ffmpeg__on_io_context_write(void *opaque, const uint8_t *buf, int len) {
  int err;

  auto context = static_cast<bare_ffmpeg_io_context_t *>(opaque);

  auto env = context->env;

  bare_ffmpeg_io_context_write_cb_t callback;
  err = js_get_reference_value(env, context->on_write, callback);
  assert(err == 0);

  js_arraybuffer_t data;
  err = js_create_arraybuffer(env, buf, static_cast<size_t>(len), data);
  assert(err == 0);

  err = js_call_function(env, callback, data);

  if (err < 0) return AVERROR(EIO);

  return 0;
}

static int
bare_ffmpeg__on_io_context_read(void *opaque, uint8_t *buf, int len) {
  int err;

  auto context = reinterpret_cast<bare_ffmpeg_io_context_t *>(opaque);

  auto env = context->env;

  bare_ffmpeg_io_context_read_cb_t callback;
  err = js_get_reference_value(env, context->on_read, callback);
  assert(err == 0);

  js_arraybuffer_t arraybuffer;
  err = js_create_external_arraybuffer(env, buf, static_cast<size_t>(len), arraybuffer);
  assert(err == 0);

  int32_t result;
  int call_status = js_call_function<js_type_options_t{}, int32_t, js_arraybuffer_t, int32_t>(env, callback, arraybuffer, len, result);

  err = js_detach_arraybuffer(env, arraybuffer);
  assert(err == 0);

  if (call_status < 0) return AVERROR(EIO);

  if (result == 0) return AVERROR_EOF;

  return result;
}

static int64_t
bare_ffmpeg__on_io_context_seek(void *opaque, int64_t offset, int whence) {
  auto context = reinterpret_cast<bare_ffmpeg_io_context_t *>(opaque);
  auto env = context->env;

  int64_t result;
  bare_ffmpeg_io_context_seek_cb_t callback;
  int err = js_get_reference_value(env, context->on_seek, callback);
  assert(err == 0);

  err = js_call_function<
    js_type_options_t{},
    int64_t,
    int64_t,
    int>(
    env, callback, offset, whence, result
  );
  if (err < 0) return AVERROR(EIO); // read-error

  if (result == -1) {
    return AVERROR(ENOSYS); // seek-op not supported by IO
  }

  return result;
}

static js_arraybuffer_t
bare_ffmpeg_io_context_init(
  js_env_t *env,
  js_receiver_t,
  std::optional<js_arraybuffer_span_t> data,
  uint64_t offset,
  uint64_t len,
  std::optional<bare_ffmpeg_io_context_write_cb_t> on_write,
  std::optional<bare_ffmpeg_io_context_read_cb_t> on_read,
  std::optional<bare_ffmpeg_io_context_seek_cb_t> on_seek
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_io_context_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  context->env = env;

  int writable = 0;

  if (on_write) {
    writable = 1;

    err = js_create_reference(env, *on_write, context->on_write);
    assert(err == 0);
  }

  if (on_read) {
    err = js_create_reference(env, *on_read, context->on_read);
    assert(err == 0);
  }

  if (on_seek) {
    err = js_create_reference(env, *on_seek, context->on_seek);
    assert(err == 0);
  }

  auto size = static_cast<size_t>(len);

  auto io = reinterpret_cast<uint8_t *>(av_malloc(size));

  if (data) {
    memcpy(io, &data.value()[static_cast<size_t>(offset)], size);
  }

  context->handle = avio_alloc_context(
    io,
    static_cast<int>(len),
    writable,
    context,
    on_read ? bare_ffmpeg__on_io_context_read : nullptr,
    on_write ? bare_ffmpeg__on_io_context_write : nullptr,
    on_seek ? bare_ffmpeg__on_io_context_seek : nullptr
  );

  if (!on_seek) {
    context->handle->seekable = 0;
  }

  return handle;
}

static void
bare_ffmpeg_io_context_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_io_context_t, 1> context
) {
  av_free(context->handle->buffer);

  avio_context_free(&context->handle);

  context->on_write.reset();
  context->on_read.reset();
  context->on_seek.reset();
}

static js_arraybuffer_t
bare_ffmpeg_output_format_init(js_env_t *env, js_receiver_t, std::string name) {
  int err;

  const AVOutputFormat *format = av_guess_format(name.c_str(), NULL, NULL);

  if (format == NULL) {
    err = js_throw_errorf(env, NULL, "No output format found for name '%s'", name.c_str());
    assert(err == 0);

    throw js_pending_exception;
  }

  js_arraybuffer_t handle;

  bare_ffmpeg_output_format_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  context->handle = format;

  return handle;
}

static int32_t
bare_ffmpeg_output_format_get_flags(
  js_env_t *,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_output_format_t, 1> format
) {
  return format->handle->flags;
}

static js_arraybuffer_t
bare_ffmpeg_input_format_init(js_env_t *env, js_receiver_t, std::string name) {
  int err;

  const AVInputFormat *format = av_find_input_format(name.c_str());

  if (format == NULL) {
    err = js_throw_errorf(env, NULL, "No input format found for name '%s'", name.c_str());
    assert(err == 0);

    throw js_pending_exception;
  }

  js_arraybuffer_t handle;

  bare_ffmpeg_input_format_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  context->handle = format;

  return handle;
}

static int32_t
bare_ffmpeg_input_format_get_flags(
  js_env_t *,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_input_format_t, 1> format
) {
  return format->handle->flags;
}

static std::string
bare_ffmpeg_input_format_get_extensions(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_input_format_t, 1> context
) {
  return context->handle->extensions;
}

static std::string
bare_ffmpeg_input_format_get_mime_type(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_input_format_t, 1> context
) {
  return context->handle->mime_type;
}

static js_arraybuffer_t
bare_ffmpeg_format_context_open_input_with_io(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_io_context_t, 1> io
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_format_context_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  context->handle = avformat_alloc_context();
  context->handle->pb = io->handle;
  context->handle->opaque = (void *) context;

  err = avformat_open_input(&context->handle, NULL, NULL, NULL);
  if (err < 0) {
    avformat_free_context(context->handle);

    bool is_exception_pending;
    err = js_is_exception_pending(env, &is_exception_pending);
    assert(err == 0);

    if (is_exception_pending) throw js_pending_exception;

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  err = avformat_find_stream_info(context->handle, NULL);
  if (err < 0) {
    avformat_close_input(&context->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return handle;
}

static js_arraybuffer_t
bare_ffmpeg_format_context_open_input_with_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_input_format_t, 1> format,
  js_arraybuffer_span_of_t<bare_ffmpeg_dictionary_t, 1> options,
  std::string url
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_format_context_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  context->handle = avformat_alloc_context();
  context->handle->opaque = (void *) context;

  err = avformat_open_input(&context->handle, url.c_str(), format->handle, &options->handle);
  if (err < 0) {
    avformat_free_context(context->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  err = avformat_find_stream_info(context->handle, NULL);
  if (err < 0) {
    avformat_close_input(&context->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return handle;
}

static void
bare_ffmpeg_format_context_close_input(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context
) {
  avformat_close_input(&context->handle);
}

static js_arraybuffer_t
bare_ffmpeg_format_context_open_output(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_output_format_t, 1> format,
  js_arraybuffer_span_of_t<bare_ffmpeg_io_context_t, 1> io
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_format_context_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  err = avformat_alloc_output_context2(&context->handle, format->handle, NULL, NULL);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  context->handle->pb = io->handle;
  context->handle->opaque = (void *) context;

  return handle;
}

static std::string
bare_ffmpeg_output_format_get_extensions(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_output_format_t, 1> context
) {
  return context->handle->extensions;
}

static std::string
bare_ffmpeg_output_format_get_mime_type(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_output_format_t, 1> context
) {
  return context->handle->mime_type;
}

static void
bare_ffmpeg_format_context_close_output(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context
) {
  avformat_free_context(context->handle);
}

static js_array_t
bare_ffmpeg_format_context_get_streams(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context
) {
  int err;

  auto len = context->handle->nb_streams;

  js_array_t result;
  err = js_create_array(env, len, result);
  assert(err == 0);

  for (uint32_t i = 0; i < len; i++) {
    js_arraybuffer_t handle;

    bare_ffmpeg_stream_t *stream;
    err = js_create_arraybuffer(env, stream, handle);
    assert(err == 0);

    stream->handle = context->handle->streams[i];

    err = js_set_element(env, result, i, handle);
    assert(err == 0);
  }

  return result;
}

static int
bare_ffmpeg_format_context_get_best_stream_index(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context,
  int32_t type
) {
  auto i = av_find_best_stream(context->handle, static_cast<AVMediaType>(type), -1, -1, NULL, 0);

  if (i < 0) i = -1;

  return i;
}

static js_arraybuffer_t
bare_ffmpeg_format_context_create_stream(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_stream_t *stream;
  err = js_create_arraybuffer(env, stream, handle);
  assert(err == 0);

  stream->handle = avformat_new_stream(context->handle, NULL);

  return handle;
}

static bool
bare_ffmpeg_format_context_read_frame(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int err;

  av_packet_unref(packet->handle);

  err = av_read_frame(context->handle, packet->handle);
  if (err < 0 && err != AVERROR(EAGAIN) && err != AVERROR_EOF) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return err == 0;
}

static bool
bare_ffmpeg_format_context_write_header(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context,
  std::optional<js_arraybuffer_span_of_t<bare_ffmpeg_dictionary_t, 1>> options
) {
  int err;

  if (options) {
    err = avformat_write_header(context->handle, &options.value()->handle);
  } else {
    err = avformat_write_header(context->handle, NULL);
  }

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return err;
}

static void
bare_ffmpeg_format_context_write_frame(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int err;

  err = av_interleaved_write_frame(context->handle, packet->handle);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static void
bare_ffmpeg_format_context_write_trailer(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context
) {
  int err;

  err = av_write_trailer(context->handle);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static void
bare_ffmpeg_format_context_dump(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context,
  bool is_output,
  int32_t index,
  std::string url
) {
  av_dump_format(context->handle, index, url.c_str(), is_output);

  for (int i = 0; i < context->handle->nb_streams; i++) {
    auto stream = context->handle->streams[i];

    av_log(NULL, AV_LOG_INFO, "  - stream=%i timebase=(%i / %i)\n", i, stream->time_base.num, stream->time_base.den);
  }
}

static int32_t
bare_ffmpeg_stream_get_index(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_stream_t, 1> stream
) {
  return stream->handle->index;
}

static int32_t
bare_ffmpeg_stream_get_id(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_stream_t, 1> stream
) {
  return stream->handle->id;
}

static void
bare_ffmpeg_stream_set_id(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_stream_t, 1> stream,
  int32_t id
) {
  stream->handle->id = id;
}

static js_arraybuffer_t
bare_ffmpeg_stream_get_time_base(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_stream_t, 1> stream
) {
  int err;

  js_arraybuffer_t result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2, data, result);
  assert(err == 0);

  data[0] = stream->handle->time_base.num;
  data[1] = stream->handle->time_base.den;

  return result;
}

static void
bare_ffmpeg_stream_set_time_base(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_stream_t, 1> stream,
  int num,
  int den
) {
  stream->handle->time_base.num = num;
  stream->handle->time_base.den = den;
}

static js_arraybuffer_t
bare_ffmpeg_stream_get_avg_framerate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_stream_t, 1> stream
) {
  int err;

  js_arraybuffer_t result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2, data, result);
  assert(err == 0);

  data[0] = stream->handle->avg_frame_rate.num;
  data[1] = stream->handle->avg_frame_rate.den;

  return result;
}

static void
bare_ffmpeg_stream_set_avg_framerate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_stream_t, 1> stream,
  int num,
  int den
) {
  stream->handle->avg_frame_rate.num = num;
  stream->handle->avg_frame_rate.den = den;
}

static js_arraybuffer_t
bare_ffmpeg_stream_get_codec_parameters(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_stream_t, 1> stream
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_create_arraybuffer(env, parameters, handle);
  assert(err == 0);

  parameters->handle = stream->handle->codecpar;

  return handle;
}

static js_arraybuffer_t
bare_ffmpeg_find_decoder_by_id(js_env_t *env, js_receiver_t, uint32_t id) {
  int err;

  const AVCodec *decoder = avcodec_find_decoder((enum AVCodecID) id);

  if (decoder == NULL) {
    err = js_throw_errorf(env, NULL, "No decoder found for codec '%d'", id);
    assert(err == 0);

    throw js_pending_exception;
  }

  js_arraybuffer_t handle;

  bare_ffmpeg_codec_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  context->handle = decoder;

  return handle;
}

static js_arraybuffer_t
bare_ffmpeg_find_encoder_by_id(js_env_t *env, js_receiver_t, uint32_t id) {
  int err;

  const AVCodec *encoder = avcodec_find_encoder((enum AVCodecID) id);

  if (encoder == NULL) {
    err = js_throw_errorf(env, NULL, "No encoder found for codec '%d'", id);
    assert(err == 0);

    throw js_pending_exception;
  }

  js_arraybuffer_t handle;

  bare_ffmpeg_codec_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  context->handle = encoder;

  return handle;
}

static std::string
bare_ffmpeg_get_codec_name_by_id(js_env_t *env, js_receiver_t, uint32_t id) {
  auto name = avcodec_get_name((enum AVCodecID) id);

  return std::string(name);
}

static std::string
bare_ffmpeg_get_sample_format_name_by_id(js_env_t *env, js_receiver_t, uint32_t id) {
  return av_get_sample_fmt_name(static_cast<enum AVSampleFormat>(id));
}

static std::vector<int32_t>
bare_ffmpeg_codec_get_supported_config(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_t, 1> codec,
  int32_t cfg
) {
  int err;

  int count = 0;
  const void *list = nullptr;

  err = avcodec_get_supported_config(context->handle, codec->handle, static_cast<AVCodecConfig>(cfg), 0, &list, &count);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  std::vector<int32_t> values;

  if (count > 0 && list) {
    const int32_t *int_list = static_cast<const int32_t *>(list);
    for (int i = 0; i < count; i++) {
      values.push_back(int_list[i]);
    }
    return values;
  }

  switch (static_cast<AVCodecConfig>(cfg)) {
  case AV_CODEC_CONFIG_PIX_FORMAT:
    for (int i = 0; i < AV_PIX_FMT_NB; i++) {
      if (av_pix_fmt_desc_get(static_cast<AVPixelFormat>(i)) != nullptr) {
        values.push_back(i);
      }
    }
    break;
  case AV_CODEC_CONFIG_SAMPLE_FORMAT:
    for (int i = 0; i < AV_SAMPLE_FMT_NB; i++) {
      values.push_back(i);
    }
    break;
  case AV_CODEC_CONFIG_COLOR_RANGE:
    values.push_back(AVCOL_RANGE_UNSPECIFIED);
    values.push_back(AVCOL_RANGE_MPEG);
    values.push_back(AVCOL_RANGE_JPEG);
    break;
  case AV_CODEC_CONFIG_COLOR_SPACE:
    for (int i = 0; i < AVCOL_SPC_NB; i++) {
      values.push_back(i);
    }
    break;
  case AV_CODEC_CONFIG_SAMPLE_RATE:
    values.push_back(0);
    break;
  default:
    break;
  }

  return values;
}

static std::optional<js_arraybuffer_t>
bare_ffmpeg_codec_get_supported_frame_rates(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_t, 1> codec
) {
  int err;

  const AVCodecContext *ctx = context->handle;
  const AVCodec *c = codec->handle;

  int count = 0;
  const void *list = nullptr;

  err = avcodec_get_supported_config(ctx, c, AV_CODEC_CONFIG_FRAME_RATE, 0, &list, &count);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  if (!list || count == 0) {
    return std::nullopt;
  }

  js_arraybuffer_t result;
  int32_t *data;
  err = js_create_arraybuffer(env, static_cast<size_t>(count * 2), data, result);
  assert(err == 0);

  const AVRational *rational_list = static_cast<const AVRational *>(list);
  for (int i = 0; i < count; i++) {
    data[i * 2] = rational_list[i].num;
    data[i * 2 + 1] = rational_list[i].den;
  }

  return result;
}

static std::optional<std::vector<js_arraybuffer_t>>
bare_ffmpeg_codec_get_supported_channel_layouts(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_t, 1> codec
) {
  int err;
  std::vector<js_arraybuffer_t> result;

  const AVCodecContext *ctx = context->handle;
  const AVCodec *c = codec->handle;

  int count = 0;
  const void *list = nullptr;

  err = avcodec_get_supported_config(ctx, c, AV_CODEC_CONFIG_CHANNEL_LAYOUT, 0, &list, &count);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  if (!list || count == 0) {
    return std::nullopt;
  }

  const AVChannelLayout *layout_list = static_cast<const AVChannelLayout *>(list);
  for (int i = 0; i < count; i++) {
    js_arraybuffer_t handle;
    bare_ffmpeg_channel_layout_t *layout;
    err = js_create_arraybuffer(env, layout, handle);
    assert(err == 0);

    err = av_channel_layout_copy(&layout->handle, &layout_list[i]);
    assert(err >= 0);

    result.push_back(handle);
  }

  return result;
}

static js_arraybuffer_t
bare_ffmpeg_codec_context_init(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_t, 1> codec
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_codec_context_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  context->handle = avcodec_alloc_context3(codec->handle);
  context->handle->opaque = (void *) context;

  return handle;
}

static void
bare_ffmpeg_codec_context_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  avcodec_free_context(&context->handle);
}

static bool
bare_ffmpeg_codec_context_open(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  int err;

  err = avcodec_open2(context->handle, context->handle->codec, NULL);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return err == 0;
}

static int32_t
bare_ffmpeg_codec_context_get_flags(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  return context->handle->flags;
}

static void
bare_ffmpeg_codec_context_set_flags(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  int32_t value
) {
  context->handle->flags = value;
}

static js_arraybuffer_t
bare_ffmpeg_codec_context_get_extra_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  js_arraybuffer_t buffer;
  int err = js_create_arraybuffer(
    env,
    context->handle->extradata,
    static_cast<size_t>(context->handle->extradata_size),
    buffer
  );
  assert(err == 0);

  return buffer;
}

void
bare_ffmpeg_codec_context_set_extra_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_t buffer,
  uint32_t offset,
  uint32_t len
) {
  std::span<uint8_t> view;
  int err = js_get_arraybuffer_info(env, buffer, view);
  assert(err == 0);

  if (context->handle->extradata_size) {
    av_free(context->handle->extradata);
  }

  context->handle->extradata = reinterpret_cast<uint8_t *>(av_malloc(len + AV_INPUT_BUFFER_PADDING_SIZE));

  memset(&context->handle->extradata[len], 0, AV_INPUT_BUFFER_PADDING_SIZE);
  memcpy(context->handle->extradata, &view[offset], len);

  context->handle->extradata_size = static_cast<int>(len);
}

static int
bare_ffmpeg_frame_get_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  return frame->handle->format;
}

static void
bare_ffmpeg_frame_set_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int format
) {
  frame->handle->format = format;
}

static js_arraybuffer_t
bare_ffmpeg_frame_get_channel_layout(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int err;

  js_arraybuffer_t result;

  bare_ffmpeg_channel_layout_t *layout;
  err = js_create_arraybuffer(env, layout, result);
  assert(err == 0);

  err = av_channel_layout_copy(&layout->handle, &frame->handle->ch_layout);
  assert(err == 0);

  return result;
}

static void
bare_ffmpeg_frame_set_channel_layout(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  js_arraybuffer_span_of_t<bare_ffmpeg_channel_layout_t, 1> layout
) {
  int err;

  err = av_channel_layout_copy(&frame->handle->ch_layout, &layout->handle);
  assert(err == 0);
}

static void
bare_ffmpeg_frame_copy_properties(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> dst,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> src
) {
  int err = av_frame_copy_props(dst->handle, src->handle);

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static bool
bare_ffmpeg_codec_context_open_with_options(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_dictionary_t, 1> options
) {
  int err;

  err = avcodec_open2(context->handle, context->handle->codec, &options->handle);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return err == 0;
}

static int64_t
bare_ffmpeg_codec_context_get_pixel_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  return context->handle->pix_fmt;
}

static void
bare_ffmpeg_codec_context_set_pixel_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  int32_t value
) {
  context->handle->pix_fmt = static_cast<AVPixelFormat>(value);
}

static int64_t
bare_ffmpeg_codec_context_get_width(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  return context->handle->width;
}

static void
bare_ffmpeg_codec_context_set_width(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  int value
) {
  context->handle->width = value;
}

static int64_t
bare_ffmpeg_codec_context_get_height(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  return context->handle->height;
}

static void
bare_ffmpeg_codec_context_set_height(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  int value
) {
  context->handle->height = value;
}

static int64_t
bare_ffmpeg_codec_context_get_sample_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  return context->handle->sample_fmt;
}

static void
bare_ffmpeg_codec_context_set_sample_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  int32_t value
) {
  context->handle->sample_fmt = static_cast<AVSampleFormat>(value);
}

static js_arraybuffer_t
bare_ffmpeg_codec_context_get_time_base(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  int err;

  js_arraybuffer_t result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2, data, result);
  assert(err == 0);

  data[0] = context->handle->time_base.num;
  data[1] = context->handle->time_base.den;

  return result;
}

static void
bare_ffmpeg_codec_context_set_time_base(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  int num,
  int den
) {
  context->handle->time_base.num = num;
  context->handle->time_base.den = den;
}

static js_arraybuffer_t
bare_ffmpeg_codec_context_get_channel_layout(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  int err;

  js_arraybuffer_t result;

  bare_ffmpeg_channel_layout_t *layout;
  err = js_create_arraybuffer(env, layout, result);
  assert(err == 0);

  err = av_channel_layout_copy(&layout->handle, &context->handle->ch_layout);
  assert(err == 0);

  return result;
}

static void
bare_ffmpeg_codec_context_set_channel_layout(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_channel_layout_t, 1> layout
) {
  int err;

  err = av_channel_layout_copy(&context->handle->ch_layout, &layout->handle);
  assert(err == 0);
}

static int
bare_ffmpeg_codec_context_get_sample_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  return context->handle->sample_rate;
}

static void
bare_ffmpeg_codec_context_set_sample_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  int32_t sample_rate
) {
  context->handle->sample_rate = sample_rate;
}

static int
bare_ffmpeg_codec_context_get_gop_size(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  return context->handle->gop_size;
}

static void
bare_ffmpeg_codec_context_set_gop_size(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  int32_t gop_size
) {
  context->handle->gop_size = gop_size;
}

static int
bare_ffmpeg_codec_context_get_frame_size(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  return context->handle->frame_size;
}

static int64_t
bare_ffmpeg_codec_context_get_frame_num(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  return context->handle->frame_num;
}

static js_arraybuffer_t
bare_ffmpeg_codec_context_get_framerate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  int err;

  js_arraybuffer_t result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2, data, result);
  assert(err == 0);

  data[0] = context->handle->framerate.num;
  data[1] = context->handle->framerate.den;

  return result;
}

static void
bare_ffmpeg_codec_context_set_framerate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  int num,
  int den
) {
  context->handle->framerate.num = num;
  context->handle->framerate.den = den;
}

static bool
bare_ffmpeg_codec_context_send_packet(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int err;

  err = avcodec_send_packet(context->handle, packet->handle);
  if (err < 0 && err != AVERROR(EAGAIN) && err != AVERROR_EOF) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return err == 0;
}

static bool
bare_ffmpeg_codec_context_receive_packet(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int err;

  err = avcodec_receive_packet(context->handle, packet->handle);
  if (err < 0 && err != AVERROR(EAGAIN) && err != AVERROR_EOF) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return err == 0;
}

static bool
bare_ffmpeg_codec_context_send_frame(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  std::optional<js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1>> frame
) {
  int err;

  if (frame) {
    err = avcodec_send_frame(context->handle, frame.value()->handle);
  } else {
    err = avcodec_send_frame(context->handle, NULL); // End of stream
  }

  if (err < 0 && err != AVERROR(EAGAIN) && err != AVERROR_EOF) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return err == 0;
}

static bool
bare_ffmpeg_codec_context_receive_frame(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int err;

  err = avcodec_receive_frame(context->handle, frame->handle);
  if (err < 0 && err != AVERROR(EAGAIN) && err != AVERROR_EOF) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return err == 0;
}

static void
bare_ffmpeg_codec_parameters_from_context(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  int err;

  err = avcodec_parameters_from_context(parameters->handle, context->handle);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static void
bare_ffmpeg_codec_parameters_to_context(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  int err;

  err = avcodec_parameters_to_context(context->handle, parameters->handle);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static js_arraybuffer_t
bare_ffmpeg_codec_parameters_alloc(
  js_env_t *env,
  js_receiver_t
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_create_arraybuffer(env, parameters, handle);
  assert(err == 0);

  parameters->handle = avcodec_parameters_alloc();

  return handle;
}

static void
bare_ffmpeg_codec_parameters_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  avcodec_parameters_free(&parameters->handle);
}

static int64_t
bare_ffmpeg_codec_parameters_get_bit_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->bit_rate;
}

static void
bare_ffmpeg_codec_parameters_set_bit_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int64_t bit_rate
) {
  parameters->handle->bit_rate = bit_rate;
}

static int
bare_ffmpeg_codec_parameters_get_bits_per_coded_sample(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->bits_per_coded_sample;
}

static void
bare_ffmpeg_codec_parameters_set_bits_per_coded_sample(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int bits
) {
  parameters->handle->bits_per_coded_sample = bits;
}

static int
bare_ffmpeg_codec_parameters_get_bits_per_raw_sample(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->bits_per_raw_sample;
}

static void
bare_ffmpeg_codec_parameters_set_bits_per_raw_sample(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int bits
) {
  parameters->handle->bits_per_raw_sample = bits;
}

static int
bare_ffmpeg_codec_parameters_get_sample_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->sample_rate;
}

static void
bare_ffmpeg_codec_parameters_set_sample_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int rate
) {
  parameters->handle->sample_rate = rate;
}

static int
bare_ffmpeg_codec_parameters_get_nb_channels(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->ch_layout.nb_channels;
}

static void
bare_ffmpeg_codec_parameters_set_nb_channels(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int nb_channels
) {
  parameters->handle->ch_layout.nb_channels = nb_channels;
}

static int64_t
bare_ffmpeg_codec_parameters_get_type(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->codec_type;
}

static void
bare_ffmpeg_codec_parameters_set_type(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int type
) {
  parameters->handle->codec_type = static_cast<AVMediaType>(type);
}

static uint32_t
bare_ffmpeg_codec_parameters_get_tag(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->codec_tag;
}

static void
bare_ffmpeg_codec_parameters_set_tag(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  uint32_t codec_tag
) {
  parameters->handle->codec_tag = codec_tag;
}

static int32_t
bare_ffmpeg_codec_parameters_get_id(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->codec_id;
}

static void
bare_ffmpeg_codec_parameters_set_id(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  uint32_t codec_id
) {
  parameters->handle->codec_id = static_cast<AVCodecID>(codec_id);
}

static int
bare_ffmpeg_codec_parameters_get_level(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->level;
}

static void
bare_ffmpeg_codec_parameters_set_level(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int level
) {
  parameters->handle->level = level;
}

static int
bare_ffmpeg_codec_parameters_get_profile(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->profile;
}

static void
bare_ffmpeg_codec_parameters_set_profile(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int profile
) {
  parameters->handle->profile = profile;
}

static int
bare_ffmpeg_codec_parameters_get_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->format;
}

static void
bare_ffmpeg_codec_parameters_set_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int format
) {
  parameters->handle->format = format;
}

static js_arraybuffer_t
bare_ffmpeg_codec_parameters_get_channel_layout(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  int err;

  js_arraybuffer_t result;

  bare_ffmpeg_channel_layout_t *layout;
  err = js_create_arraybuffer(env, layout, result);
  assert(err == 0);

  err = av_channel_layout_copy(&layout->handle, &parameters->handle->ch_layout);
  assert(err == 0);

  return result;
}

static void
bare_ffmpeg_codec_parameters_set_channel_layout(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  js_arraybuffer_span_of_t<bare_ffmpeg_channel_layout_t, 1> layout
) {
  int err;

  err = av_channel_layout_copy(&parameters->handle->ch_layout, &layout->handle);
  assert(err == 0);
}

static int
bare_ffmpeg_codec_parameters_get_width(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->width;
}

static void
bare_ffmpeg_codec_parameters_set_width(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int width
) {
  parameters->handle->width = width;
}

static int32_t
bare_ffmpeg_codec_parameters_get_height(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->height;
}

static void
bare_ffmpeg_codec_parameters_set_height(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int height
) {
  parameters->handle->height = height;
}

static js_arraybuffer_t
bare_ffmpeg_codec_parameters_get_framerate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  int err;

  js_arraybuffer_t result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2, data, result);
  assert(err == 0);

  data[0] = parameters->handle->framerate.num;
  data[1] = parameters->handle->framerate.den;

  return result;
}

static void
bare_ffmpeg_codec_parameters_set_framerate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int numerator,
  int denominator
) {
  parameters->handle->framerate.num = numerator;
  parameters->handle->framerate.den = denominator;
}

static js_arraybuffer_t
bare_ffmpeg_codec_parameters_get_extra_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  int err;

  js_arraybuffer_t buffer;

  assert(parameters->handle->extradata_size >= 0);

  err = js_create_arraybuffer(
    env,
    parameters->handle->extradata,
    static_cast<size_t>(parameters->handle->extradata_size),
    buffer
  );
  assert(err == 0);

  return buffer;
}

void
bare_ffmpeg_codec_parameters_set_extra_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  js_arraybuffer_t buffer,
  uint32_t offset,
  uint32_t len
) {
  int err;

  std::span<uint8_t> view;
  err = js_get_arraybuffer_info(env, buffer, view);
  assert(err == 0);

  if (parameters->handle->extradata_size) {
    assert(parameters->handle->extradata_size > 0);
    assert(parameters->handle->extradata);

    av_free(parameters->handle->extradata);
  }

  size_t min_size = len + AV_INPUT_BUFFER_PADDING_SIZE;

  parameters->handle->extradata = reinterpret_cast<uint8_t *>(av_malloc(min_size));

  memset(&parameters->handle->extradata[len], 0, AV_INPUT_BUFFER_PADDING_SIZE);

  memcpy(parameters->handle->extradata, &view[offset], len);

  parameters->handle->extradata_size = static_cast<int>(len);
}

static int
bare_ffmpeg_codec_parameters_get_block_align(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->block_align;
}

static void
bare_ffmpeg_codec_parameters_set_block_align(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int block_align
) {
  parameters->handle->block_align = block_align;
}

static int
bare_ffmpeg_codec_parameters_get_initial_padding(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->initial_padding;
}

static void
bare_ffmpeg_codec_parameters_set_initial_padding(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int initial_padding
) {
  parameters->handle->initial_padding = initial_padding;
}

static int
bare_ffmpeg_codec_parameters_get_trailing_padding(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->trailing_padding;
}

static void
bare_ffmpeg_codec_parameters_set_trailing_padding(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int trailing_padding
) {
  parameters->handle->trailing_padding = trailing_padding;
}

static int
bare_ffmpeg_codec_parameters_get_seek_preroll(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->seek_preroll;
}

static void
bare_ffmpeg_codec_parameters_set_seek_preroll(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int seek_preroll
) {
  parameters->handle->seek_preroll = seek_preroll;
}

static js_arraybuffer_t
bare_ffmpeg_codec_parameters_get_sample_aspect_ratio(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  int err;
  js_arraybuffer_t result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2, data, result);
  assert(err == 0);

  data[0] = parameters->handle->sample_aspect_ratio.num;
  data[1] = parameters->handle->sample_aspect_ratio.den;

  return result;
}

static void
bare_ffmpeg_codec_parameters_set_sample_aspect_ratio(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int num,
  int den
) {
  parameters->handle->sample_aspect_ratio.num = num;
  parameters->handle->sample_aspect_ratio.den = den;
}

static int
bare_ffmpeg_codec_parameters_get_video_delay(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->video_delay;
}

static void
bare_ffmpeg_codec_parameters_set_video_delay(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int delay
) {
  parameters->handle->video_delay = delay;
}

static int
bare_ffmpeg_codec_parameters_get_frame_size(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->frame_size;
}

static void
bare_ffmpeg_codec_parameters_set_frame_size(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters,
  int frame_size
) {
  parameters->handle->frame_size = frame_size;
}

static js_arraybuffer_t
bare_ffmpeg_frame_init(js_env_t *env, js_receiver_t) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_frame_t *frame;
  err = js_create_arraybuffer(env, frame, handle);
  assert(err == 0);

  frame->handle = av_frame_alloc();
  frame->handle->opaque = (void *) frame;

  return handle;
}

static void
bare_ffmpeg_frame_unref(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  av_frame_unref(frame->handle);
}

static void
bare_ffmpeg_frame_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  av_frame_free(&frame->handle);
}

static int32_t
bare_ffmpeg_frame_get_width(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  return frame->handle->width;
}

static void
bare_ffmpeg_frame_set_width(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int32_t width
) {
  frame->handle->width = width;
}

static int32_t
bare_ffmpeg_frame_get_height(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  return frame->handle->height;
}

static void
bare_ffmpeg_frame_set_height(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int32_t height
) {
  frame->handle->height = height;
}

static int32_t
bare_ffmpeg_frame_get_nb_samples(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  return frame->handle->nb_samples;
}

static void
bare_ffmpeg_frame_set_nb_samples(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int32_t nb_samples
) {
  frame->handle->nb_samples = nb_samples;
}

static int32_t
bare_ffmpeg_frame_get_pict_type(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  return frame->handle->pict_type;
}

static int64_t
bare_ffmpeg_frame_get_pts(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int64_t ts = frame->handle->pts;

  if (ts == AV_NOPTS_VALUE) return -1;

  return ts;
}

static void
bare_ffmpeg_frame_set_pts(
  js_env_t *,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int64_t value
) {
  frame->handle->pts = value;
}

static int64_t
bare_ffmpeg_frame_get_pkt_dts(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int64_t ts = frame->handle->pkt_dts;

  if (ts == AV_NOPTS_VALUE) return -1;

  return ts;
}

static void
bare_ffmpeg_frame_set_pkt_dts(
  js_env_t *,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int64_t value
) {
  frame->handle->pkt_dts = value;
}

static js_arraybuffer_t
bare_ffmpeg_frame_get_time_base(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int err;

  js_arraybuffer_t result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2, data, result);
  assert(err == 0);

  data[0] = frame->handle->time_base.num;
  data[1] = frame->handle->time_base.den;

  return result;
}

static void
bare_ffmpeg_frame_set_time_base(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int num,
  int den
) {
  frame->handle->time_base.num = num;
  frame->handle->time_base.den = den;
}

static int32_t
bare_ffmpeg_frame_get_sample_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  return frame->handle->sample_rate;
}

static void
bare_ffmpeg_frame_set_sample_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int32_t rate
) {
  frame->handle->sample_rate = rate;
}

static void
bare_ffmpeg_frame_alloc(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int align
) {
  int err;

  err = av_frame_get_buffer(frame->handle, align);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static js_arraybuffer_t
bare_ffmpeg_image_init(
  js_env_t *env,
  js_receiver_t,
  int32_t pixel_format,
  int32_t width,
  int32_t height,
  int32_t align
) {
  int err;

  auto len = av_image_get_buffer_size(
    static_cast<AVPixelFormat>(pixel_format),
    width,
    height,
    align
  );

  if (len < 0) {
    err = js_throw_error(env, NULL, av_err2str(len));
    assert(err == 0);

    throw js_pending_exception;
  }

  js_arraybuffer_t handle;
  err = js_create_arraybuffer(env, static_cast<size_t>(len), handle);
  assert(err == 0);

  return handle;
}

static void
bare_ffmpeg_image_fill(
  js_env_t *env,
  js_receiver_t,
  int32_t pixel_format,
  int32_t width,
  int32_t height,
  int32_t align,
  js_arraybuffer_span_t data,
  uint64_t offset,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int err;

  auto len = av_image_fill_arrays(
    frame->handle->data,
    frame->handle->linesize,
    &data[static_cast<size_t>(offset)],
    static_cast<AVPixelFormat>(pixel_format),
    width,
    height,
    align
  );

  if (len < 0) {
    err = js_throw_error(env, NULL, av_err2str(len));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static void
bare_ffmpeg_image_read(
  js_env_t *env,
  js_receiver_t,
  int32_t pixel_format,
  int32_t width,
  int32_t height,
  int32_t align,
  js_arraybuffer_span_t data,
  uint64_t offset,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int err;

  uint8_t *dst_data[4];
  int dst_linesize[4];

  auto len = av_image_fill_arrays(
    dst_data,
    dst_linesize,
    &data[offset],
    static_cast<AVPixelFormat>(pixel_format),
    width,
    height,
    align
  );

  if (len < 0) {
    err = js_throw_error(env, NULL, av_err2str(len));
    assert(err == 0);

    throw js_pending_exception;
  }

  av_image_copy(
    dst_data,
    dst_linesize,
    frame->handle->data,
    frame->handle->linesize,
    static_cast<AVPixelFormat>(pixel_format),
    width,
    height
  );
}

static int
bare_ffmpeg_image_get_line_size(
  js_env_t *env,
  js_receiver_t,
  int32_t pixel_format,
  int32_t width,
  int32_t plane
) {
  return av_image_get_linesize(
    static_cast<AVPixelFormat>(pixel_format),
    width,
    plane
  );
}

static int
bare_ffmpeg_samples_buffer_size(
  js_env_t *env,
  js_receiver_t,
  int32_t sample_format,
  int32_t nb_channels,
  int32_t nb_samples,
  bool no_alignment
) {
  auto len = av_samples_get_buffer_size(
    NULL,
    nb_channels,
    nb_samples,
    static_cast<AVSampleFormat>(sample_format),
    no_alignment
  );

  if (len < 0) {
    int err = js_throw_error(env, NULL, av_err2str(len));
    assert(err == 0);

    throw js_pending_exception;
  }

  return len;
}

static int
bare_ffmpeg_samples_fill(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  js_arraybuffer_span_t target,
  uint64_t offset,
  bool no_alignment
) {
  auto res = av_samples_fill_arrays(
    frame->handle->data,
    frame->handle->linesize,
    &target[offset],
    frame->handle->ch_layout.nb_channels,
    frame->handle->nb_samples,
    static_cast<AVSampleFormat>(frame->handle->format),
    no_alignment
  );

  if (res < 0) {
    int err = js_throw_error(env, NULL, av_err2str(res));
    assert(err == 0);

    throw js_pending_exception;
  }

  return res;
}

static int
bare_ffmpeg_samples_read(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  js_arraybuffer_span_t target,
  uint64_t offset,
  bool no_alignment
) {
  int err;

  uint8_t *dst_data[8];
  int dst_linesize[4];

  auto len = av_samples_fill_arrays(
    dst_data,
    dst_linesize,
    &target[offset],
    frame->handle->ch_layout.nb_channels,
    frame->handle->nb_samples,
    static_cast<AVSampleFormat>(frame->handle->format),
    no_alignment
  );
  if (len < 0) {
    err = js_throw_error(env, NULL, av_err2str(len));
    assert(err == 0);

    throw js_pending_exception;
  }

  err = av_samples_copy(
    dst_data,
    frame->handle->data,
    0,
    0,
    frame->handle->nb_samples,
    frame->handle->ch_layout.nb_channels,
    static_cast<AVSampleFormat>(frame->handle->format)
  );
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return len;
}

static js_arraybuffer_t
bare_ffmpeg_packet_init(js_env_t *env, js_receiver_t) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_packet_t *packet;
  err = js_create_arraybuffer(env, packet, handle);
  assert(err == 0);

  packet->handle = av_packet_alloc();

  return handle;
}

static js_arraybuffer_t
bare_ffmpeg_packet_init_from_buffer(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_t data,
  uint64_t offset,
  uint64_t len
) {
  int err;

  AVPacket *pkt = av_packet_alloc();

  err = av_new_packet(pkt, static_cast<int>(len));
  assert(err == 0);

  memcpy(pkt->data, &data[static_cast<size_t>(offset)], static_cast<size_t>(len));

  js_arraybuffer_t handle;

  bare_ffmpeg_packet_t *packet;
  err = js_create_arraybuffer(env, packet, handle);
  assert(err == 0);

  packet->handle = pkt;

  return handle;
}

static void
bare_ffmpeg_packet_unref(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  av_packet_unref(packet->handle);
}

static void
bare_ffmpeg_packet_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  av_packet_free(&packet->handle);
}

static int32_t
bare_ffmpeg_packet_get_stream_index(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  return packet->handle->stream_index;
}

static void
bare_ffmpeg_packet_set_stream_index(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  int32_t value
) {
  packet->handle->stream_index = value;
}

static js_arraybuffer_t
bare_ffmpeg_packet_get_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int err;

  auto size = static_cast<size_t>(packet->handle->size);

  js_arraybuffer_t handle;

  uint8_t *data;
  err = js_create_arraybuffer(env, size, data, handle);
  assert(err == 0);

  memcpy(data, packet->handle->data, size);

  return handle;
}

static void
bare_ffmpeg_packet_set_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  js_arraybuffer_span_t data,
  uint32_t offset,
  uint32_t len
) {
  int err;

  assert(offset + len <= data.size());

  av_packet_unref(packet->handle);

  err = av_new_packet(packet->handle, static_cast<int>(len));
  assert(err == 0);

  memcpy(packet->handle->data, &data[offset], len);
}

static std::vector<js_arraybuffer_t>
bare_ffmpeg_packet_get_side_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  std::vector<js_arraybuffer_t> res{};

  int count = packet->handle->side_data_elems;
  if (count == 0) return res;

  for (int i = 0; i < count; i++) {
    js_arraybuffer_t handle;
    bare_ffmpeg_side_data_t *sd;
    int err = js_create_arraybuffer(env, sd, handle);
    assert(err == 0);

    sd->handle = &packet->handle->side_data[i];

    res.push_back(handle);
  }

  return res;
}

static void
bare_ffmpeg_packet_set_side_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  std::vector<js_object_t> side_data_array
) {
  for (js_object_t side_data : side_data_array) {
    int err;

    int32_t type;
    err = js_get_property(env, side_data, "type", type);
    assert(err == 0);

    js_arraybuffer_span_t buf;
    err = js_get_property(env, side_data, "buffer", buf);
    assert(err == 0);

    int32_t offset;
    err = js_get_property(env, side_data, "offset", offset);
    assert(err == 0);

    int32_t len;
    err = js_get_property(env, side_data, "length", len);
    assert(err == 0);

    uint8_t *data = av_packet_new_side_data(packet->handle, static_cast<AVPacketSideDataType>(type), static_cast<size_t>(len));
    memcpy(data, &buf[static_cast<size_t>(offset)], static_cast<size_t>(len));
  }
}

static bool
bare_ffmpeg_packet_is_keyframe(
  js_env_t *,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  return packet->handle->flags & AV_PKT_FLAG_KEY;
}

static void
bare_ffmpeg_packet_set_is_keyframe(
  js_env_t *,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  bool has_key_frame
) {
  if (has_key_frame) {
    packet->handle->flags |= AV_PKT_FLAG_KEY;
  } else {
    packet->handle->flags &= ~AV_PKT_FLAG_KEY;
  }
}

static int64_t
bare_ffmpeg_packet_get_dts(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int64_t ts = packet->handle->dts;

  if (ts == AV_NOPTS_VALUE) return -1;

  return ts;
}

static void
bare_ffmpeg_packet_set_dts(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  int64_t value
) {
  packet->handle->dts = value;
}

static int64_t
bare_ffmpeg_packet_get_pts(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int64_t ts = packet->handle->pts;

  if (ts == AV_NOPTS_VALUE) return -1;

  return ts;
}

static void
bare_ffmpeg_packet_set_pts(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  int64_t value
) {
  packet->handle->pts = value;
}

static js_arraybuffer_t
bare_ffmpeg_packet_get_time_base(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int err;

  js_arraybuffer_t result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2, data, result);
  assert(err == 0);

  data[0] = packet->handle->time_base.num;
  data[1] = packet->handle->time_base.den;

  return result;
}

static void
bare_ffmpeg_packet_set_time_base(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  int num,
  int den
) {
  packet->handle->time_base.num = num;
  packet->handle->time_base.den = den;
}

static void
bare_ffmpeg_packet_rescale_ts(
  js_env_t *env,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  int32_t src_num,
  int32_t src_den,
  int32_t dst_num,
  int32_t dst_den
) {
  av_packet_rescale_ts(
    packet->handle,
    {src_num, src_den},
    {dst_num, dst_den}
  );
}

static int64_t
bare_ffmpeg_packet_get_duration(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  return packet->handle->duration;
}

static void
bare_ffmpeg_packet_set_duration(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  int64_t value
) {
  packet->handle->duration = value;
}

static int32_t
bare_ffmpeg_packet_get_flags(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  return packet->handle->flags;
}

static void
bare_ffmpeg_packet_set_flags(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  int32_t value
) {
  packet->handle->flags = value;
}

static void
bare_ffmpeg_packet_copy_props(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> dst,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> src
) {
  int err;

  err = av_packet_copy_props(dst->handle, src->handle);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static int
bare_ffmpeg_side_data_get_type(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_side_data_t, 1> side_data
) {
  return side_data->handle->type;
}

static std::string
bare_ffmpeg_side_data_get_name(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_side_data_t, 1> side_data
) {
  return av_packet_side_data_name(side_data->handle->type);
}

static js_arraybuffer_t
bare_ffmpeg_side_data_get_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_side_data_t, 1> side_data
) {
  js_arraybuffer_t handle;
  uint8_t *buf;
  int err = js_create_arraybuffer(env, side_data->handle->size, buf, handle);
  assert(err == 0);

  memcpy(buf, side_data->handle->data, side_data->handle->size);

  return handle;
}

static js_arraybuffer_t
bare_ffmpeg_scaler_init(
  js_env_t *env,
  js_receiver_t,
  int64_t source_format,
  int32_t source_width,
  int32_t source_height,
  int64_t target_format,
  int32_t target_width,
  int32_t target_height
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_scaler_t *scaler;
  err = js_create_arraybuffer(env, scaler, handle);
  assert(err == 0);

  scaler->handle = sws_getContext(
    source_width,
    source_height,
    static_cast<AVPixelFormat>(source_format),
    target_width,
    target_height,
    static_cast<AVPixelFormat>(target_format),
    SWS_BICUBIC,
    NULL,
    NULL,
    NULL
  );

  return handle;
}

static void
bare_ffmpeg_scaler_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_scaler_t, 1> scaler
) {
  sws_freeContext(scaler->handle);
}

static int
bare_ffmpeg_scaler_scale(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_scaler_t, 1> scaler,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> source,
  int y,
  int height,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> target
) {
  return sws_scale(
    scaler->handle,
    reinterpret_cast<const uint8_t *const *>(source->handle->data),
    source->handle->linesize,
    y,
    height,
    target->handle->data,
    target->handle->linesize
  );
}

static js_arraybuffer_t
bare_ffmpeg_dictionary_init(
  js_env_t *env,
  js_receiver_t
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_dictionary_t *dict;
  err = js_create_arraybuffer(env, dict, handle);
  assert(err == 0);

  dict->handle = NULL;

  return handle;
}

static void
bare_ffmpeg_dictionary_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_dictionary_t, 1> dict
) {
  av_dict_free(&dict->handle);
}

static void
bare_ffmpeg_dictionary_set_entry(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_dictionary_t, 1> dict,
  std::string key,
  std::string value
) {
  int err;

  err = av_dict_set(&dict->handle, key.c_str(), value.c_str(), 0);
  assert(err == 0);
}

static std::vector<std::tuple<const char *, const char *>>
bare_ffmpeg_dictionary_get_entries(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_dictionary_t, 1> dict
) {
  std::vector<std::tuple<const char *, const char *>> entries{};

  const AVDictionaryEntry *entry = nullptr;

  while ((entry = av_dict_iterate(dict->handle, entry))) {
    entries.emplace_back(entry->key, entry->value);
  }

  return entries;
}

static std::optional<std::string>
bare_ffmpeg_dictionary_get_entry(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_dictionary_t, 1> dict,
  std::string key
) {
  AVDictionaryEntry *entry = av_dict_get(dict->handle, key.c_str(), NULL, 0);

  if (entry == NULL) {
    return std::nullopt;
  }

  return std::string{entry->value};
}

static js_arraybuffer_t
bare_ffmpeg_resampler_init(
  js_env_t *env,
  js_receiver_t,
  int32_t in_rate,
  int32_t in_fmt,
  js_arraybuffer_span_of_t<bare_ffmpeg_channel_layout_t, 1> in_layout,
  int32_t out_rate,
  int32_t out_fmt,
  js_arraybuffer_span_of_t<bare_ffmpeg_channel_layout_t, 1> out_layout
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_resampler_t *resampler;
  err = js_create_arraybuffer(env, resampler, handle);
  assert(err == 0);

  resampler->handle = swr_alloc();

  err = swr_alloc_set_opts2(
    &resampler->handle,
    &out_layout->handle,
    static_cast<AVSampleFormat>(out_fmt),
    out_rate,
    &in_layout->handle,
    static_cast<AVSampleFormat>(in_fmt),
    in_rate,
    0,
    NULL
  );

  if (err < 0) {
    swr_free(&resampler->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  err = swr_init(resampler->handle);
  if (err < 0) {
    swr_free(&resampler->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return handle;
}

static int64_t
bare_ffmpeg_resampler_convert_frames(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_resampler_t, 1> resampler,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> in_frame,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> out_frame
) {
  int err;

  auto result = swr_convert(
    resampler->handle,
    (uint8_t **) out_frame->handle->data,
    out_frame->handle->nb_samples,
    (const uint8_t **) in_frame->handle->data,
    in_frame->handle->nb_samples
  );

  if (result < 0) {
    err = js_throw_error(env, NULL, av_err2str(result));
    assert(err == 0);

    throw js_pending_exception;
  }

  return result;
}

static int64_t
bare_ffmpeg_resampler_get_delay(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_resampler_t, 1> resampler,
  int64_t base
) {
  return swr_get_delay(resampler->handle, base);
}

static int64_t
bare_ffmpeg_resampler_flush(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_resampler_t, 1> resampler,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> out_frame
) {
  int err;

  auto result = swr_convert(
    resampler->handle,
    out_frame->handle->data,
    out_frame->handle->nb_samples,
    NULL,
    0
  );

  if (result < 0) {
    err = js_throw_error(env, NULL, av_err2str(result));
    assert(err == 0);

    throw js_pending_exception;
  }

  out_frame->handle->nb_samples = result;

  return result;
}

static void
bare_ffmpeg_resampler_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_resampler_t, 1> resampler
) {
  swr_free(&resampler->handle);
}

static js_arraybuffer_t
bare_ffmpeg_channel_layout_copy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_channel_layout_t, 1> layout
) {
  int err;

  js_arraybuffer_t result;

  bare_ffmpeg_channel_layout_t *copy;
  err = js_create_arraybuffer(env, copy, result);
  assert(err == 0);

  err = av_channel_layout_copy(&copy->handle, &layout->handle);
  assert(err == 0);

  return result;
}

static int
bare_ffmpeg_channel_layout_get_nb_channels(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_channel_layout_t, 1> layout
) {
  return layout->handle.nb_channels;
}

static uint64_t
bare_ffmpeg_channel_layout_get_mask(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_channel_layout_t, 1> layout
) {
  return layout->handle.u.mask;
}

static js_arraybuffer_t
bare_ffmpeg_channel_layout_from_mask(
  js_env_t *env,
  js_receiver_t,
  uint64_t mask
) {
  int err;

  js_arraybuffer_t result;

  bare_ffmpeg_channel_layout_t *layout;
  err = js_create_arraybuffer(env, layout, result);
  assert(err == 0);

  err = av_channel_layout_from_mask(&layout->handle, mask);
  assert(err == 0);

  return result;
}

static js_arraybuffer_t
bare_ffmpeg_audio_fifo_init(
  js_env_t *env,
  js_receiver_t,
  int32_t sample_fmt,
  int32_t channels,
  int32_t nb_samples
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_audio_fifo_t *fifo;
  err = js_create_arraybuffer(env, fifo, handle);
  assert(err == 0);

  fifo->handle = av_audio_fifo_alloc(
    static_cast<AVSampleFormat>(sample_fmt),
    channels,
    nb_samples
  );

  return handle;
}

static void
bare_ffmpeg_audio_fifo_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_audio_fifo_t, 1> fifo
) {
  av_audio_fifo_free(fifo->handle);
}

static int
bare_ffmpeg_audio_fifo_write(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_audio_fifo_t, 1> fifo,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int err;

  auto len = av_audio_fifo_write(fifo->handle, (void **) frame->handle->data, frame->handle->nb_samples);

  if (len < 0) {
    err = js_throw_error(env, NULL, av_err2str(len));
    assert(err == 0);

    throw js_pending_exception;
  }

  return len;
}

static int
bare_ffmpeg_audio_fifo_read(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_audio_fifo_t, 1> fifo,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int32_t nb_samples
) {
  int err;

  auto len = av_audio_fifo_read(fifo->handle, (void **) frame->handle->data, nb_samples);

  if (len < 0) {
    err = js_throw_error(env, NULL, av_err2str(len));
    assert(err == 0);

    throw js_pending_exception;
  }

  return len;
}

static int
bare_ffmpeg_audio_fifo_peek(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_audio_fifo_t, 1> fifo,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int32_t nb_samples
) {
  int err;

  auto len = av_audio_fifo_peek(fifo->handle, (void **) frame->handle->data, nb_samples);

  if (len < 0) {
    err = js_throw_error(env, NULL, av_err2str(len));
    assert(err == 0);

    throw js_pending_exception;
  }

  return len;
}

static int
bare_ffmpeg_audio_fifo_drain(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_audio_fifo_t, 1> fifo,
  int32_t nb_samples
) {
  int err;

  auto len = av_audio_fifo_drain(fifo->handle, nb_samples);

  if (len < 0) {
    err = js_throw_error(env, NULL, av_err2str(len));
    assert(err == 0);

    throw js_pending_exception;
  }

  return len;
}

static void
bare_ffmpeg_audio_fifo_reset(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_audio_fifo_t, 1> fifo
) {
  av_audio_fifo_reset(fifo->handle);
}

static int
bare_ffmpeg_audio_fifo_size(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_audio_fifo_t, 1> fifo
) {
  return av_audio_fifo_size(fifo->handle);
}

static int
bare_ffmpeg_audio_fifo_space(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_audio_fifo_t, 1> fifo
) {
  return av_audio_fifo_space(fifo->handle);
}

static js_arraybuffer_t
bare_ffmpeg_rational_d2q(
  js_env_t *env,
  js_receiver_t,
  double num
) {
  int err;

  auto rational = av_d2q(num, 1 << 26);

  js_arraybuffer_t result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2, data, result);
  assert(err == 0);

  data[0] = rational.num;
  data[1] = rational.den;

  return result;
}

static js_arraybuffer_t
bare_ffmpeg_filter_get_by_name(
  js_env_t *env,
  js_receiver_t,
  std::string name
) {
  int err;

  js_arraybuffer_t handle;
  bare_ffmpeg_filter_t *filter;
  err = js_create_arraybuffer(env, filter, handle);
  assert(err == 0);

  filter->handle = avfilter_get_by_name(name.c_str());
  if (filter->handle == nullptr) {
    err = js_throw_errorf(env, nullptr, "No Filter found for '%s' name", name.c_str());
    assert(err == 0);

    throw js_pending_exception;
  }

  return handle;
}

static js_arraybuffer_t
bare_ffmpeg_filter_context_init(
  js_env_t *env,
  js_receiver_t
) {
  js_arraybuffer_t handle;
  bare_ffmpeg_filter_context_t *filter_ctx;
  int err = js_create_arraybuffer(env, filter_ctx, handle);
  assert(err == 0);

  return handle;
}

static js_arraybuffer_t
bare_ffmpeg_filter_graph_init(
  js_env_t *env,
  js_receiver_t
) {
  js_arraybuffer_t handle;
  bare_ffmpeg_filter_graph_t *filter_graph;
  int err = js_create_arraybuffer(env, filter_graph, handle);
  assert(err == 0);

  filter_graph->handle = avfilter_graph_alloc();
  assert(filter_graph->handle != nullptr);

  return handle;
}

static void
bare_ffmpeg_filter_graph_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_graph_t, 1> filter_graph
) {
  avfilter_graph_free(&filter_graph->handle);
}

static void
bare_ffmpeg_filter_graph_create_filter(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_graph_t, 1> graph,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_context_t, 1> filter_context,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_t, 1> filter,
  std::string name,
  std::optional<std::string> args
) {
  int err = avfilter_graph_create_filter(
    &filter_context->handle,
    filter->handle,
    name.c_str(),
    args.has_value() ? args.value().c_str() : nullptr,
    nullptr,
    graph->handle
  );

  if (err < 0) {
    err = js_throw_error(env, nullptr, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static void
bare_ffmpeg_filter_graph_parse(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_graph_t, 1> graph,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> inputs,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> outputs,
  std::string filter_description
) {
  int err = avfilter_graph_parse(graph->handle, filter_description.c_str(), inputs->handle, outputs->handle, nullptr);
  if (err < 0) {
    err = js_throw_error(env, nullptr, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static void
bare_ffmpeg_filter_graph_configure(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_graph_t, 1> graph
) {
  int err = avfilter_graph_config(graph->handle, nullptr);
  if (err < 0) {
    err = js_throw_error(env, nullptr, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
}

static int
bare_ffmpeg_filter_graph_push_frame(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_context_t, 1> ctx,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  return av_buffersrc_add_frame(ctx->handle, frame->handle);
}

static int
bare_ffmpeg_filter_graph_pull_frame(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_context_t, 1> ctx,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  return av_buffersink_get_frame(ctx->handle, frame->handle);
}

static js_arraybuffer_t
bare_ffmpeg_filter_inout_init(
  js_env_t *env,
  js_receiver_t
) {
  js_arraybuffer_t handle;
  bare_ffmpeg_filter_inout_t *filter_inout;
  int err = js_create_arraybuffer(env, filter_inout, handle);
  assert(err == 0);

  filter_inout->handle = avfilter_inout_alloc();
  assert(filter_inout->handle);

  return handle;
}

static void
bare_ffmpeg_filter_inout_destroy(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> filter_inout
) {
  avfilter_inout_free(&filter_inout->handle);
}

static std::optional<std::string>
bare_ffmpeg_filter_inout_get_name(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> filter_inout
) {
  if (!filter_inout->handle->name) return std::nullopt;
  return filter_inout->handle->name;
}

static void
bare_ffmpeg_filter_inout_set_name(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> filter_inout,
  std::string name
) {
  if (filter_inout->handle->name) {
    av_free(filter_inout->handle->name);
  }
  filter_inout->handle->name = av_strdup(name.c_str());
}

static void
bare_ffmpeg_filter_inout_set_filter_context(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> filter_inout,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_context_t, 1> filter_ctx
) {
  filter_inout->handle->filter_ctx = filter_ctx->handle;
}

static int
bare_ffmpeg_filter_inout_get_pad_idx(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> filter_inout
) {
  return filter_inout->handle->pad_idx;
}

static void
bare_ffmpeg_filter_inout_set_pad_idx(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> filter_inout,
  int pad_idx
) {
  filter_inout->handle->pad_idx = pad_idx;
}

static void
bare_ffmpeg_filter_inout_set_next(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> filter_inout,
  js_arraybuffer_span_of_t<bare_ffmpeg_filter_inout_t, 1> next
) {
  filter_inout->handle->next = next->handle;
}

static int64_t
bare_ffmpeg_rational_rescale_q(
  int64_t ts,
  int32_t bq_num,
  int32_t bq_den,
  int32_t cq_num,
  int32_t cq_den,
  int64_t av_round
) {
  return av_rescale_q_rnd(
    ts,
    {bq_num, bq_den},
    {cq_num, cq_den},
    static_cast<AVRounding>(av_round)
  );
}

static js_value_t *
bare_ffmpeg_exports(js_env_t *env, js_value_t *exports) {
  uv_once(&bare_ffmpeg__init_guard, bare_ffmpeg__on_init);

  int err;

#define V(name, fn) \
  err = js_set_property<fn>(env, exports, name); \
  assert(err == 0);

  V("getLogLevel", bare_ffmpeg_log_get_level);
  V("setLogLevel", bare_ffmpeg_log_set_level);

  V("initIOContext", bare_ffmpeg_io_context_init)
  V("destroyIOContext", bare_ffmpeg_io_context_destroy)

  V("initInputFormat", bare_ffmpeg_input_format_init)
  V("getInputFormatFlags", bare_ffmpeg_input_format_get_flags)
  V("getInputFormatExtensions", bare_ffmpeg_input_format_get_extensions)
  V("getInputFormatMimeType", bare_ffmpeg_input_format_get_mime_type)

  V("initOutputFormat", bare_ffmpeg_output_format_init)
  V("getOutputFormatFlags", bare_ffmpeg_output_format_get_flags)
  V("getOutputFormatExtensions", bare_ffmpeg_output_format_get_extensions)
  V("getOutputFormatMimeType", bare_ffmpeg_output_format_get_mime_type)

  V("openInputFormatContextWithIO", bare_ffmpeg_format_context_open_input_with_io)
  V("openInputFormatContextWithFormat", bare_ffmpeg_format_context_open_input_with_format)
  V("closeInputFormatContext", bare_ffmpeg_format_context_close_input)

  V("openOutputFormatContext", bare_ffmpeg_format_context_open_output)
  V("closeOutputFormatContext", bare_ffmpeg_format_context_close_output)

  V("getFormatContextStreams", bare_ffmpeg_format_context_get_streams)
  V("getFormatContextBestStreamIndex", bare_ffmpeg_format_context_get_best_stream_index)
  V("createFormatContextStream", bare_ffmpeg_format_context_create_stream)
  V("readFormatContextFrame", bare_ffmpeg_format_context_read_frame)
  V("writeFormatContextHeader", bare_ffmpeg_format_context_write_header)
  V("writeFormatContextFrame", bare_ffmpeg_format_context_write_frame)
  V("writeFormatContextTrailer", bare_ffmpeg_format_context_write_trailer)
  V("dumpFormatContext", bare_ffmpeg_format_context_dump)

  V("getStreamIndex", bare_ffmpeg_stream_get_index)
  V("getStreamId", bare_ffmpeg_stream_get_id)
  V("setStreamId", bare_ffmpeg_stream_set_id)
  V("getStreamTimeBase", bare_ffmpeg_stream_get_time_base)
  V("setStreamTimeBase", bare_ffmpeg_stream_set_time_base)
  V("getStreamAverageFramerate", bare_ffmpeg_stream_get_avg_framerate)
  V("setStreamAverageFramerate", bare_ffmpeg_stream_set_avg_framerate)
  V("getStreamCodecParameters", bare_ffmpeg_stream_get_codec_parameters)

  V("findDecoderByID", bare_ffmpeg_find_decoder_by_id)
  V("findEncoderByID", bare_ffmpeg_find_encoder_by_id)
  V("getCodecNameByID", bare_ffmpeg_get_codec_name_by_id)
  V("getSampleFormatNameByID", bare_ffmpeg_get_sample_format_name_by_id)
  V("getSupportedConfig", bare_ffmpeg_codec_get_supported_config)
  V("getSupportedFrameRates", bare_ffmpeg_codec_get_supported_frame_rates)
  V("getSupportedChannelLayouts", bare_ffmpeg_codec_get_supported_channel_layouts)

  V("initCodecContext", bare_ffmpeg_codec_context_init)
  V("destroyCodecContext", bare_ffmpeg_codec_context_destroy)
  V("openCodecContext", bare_ffmpeg_codec_context_open)
  V("openCodecContextWithOptions", bare_ffmpeg_codec_context_open_with_options)
  V("getCodecContextFlags", bare_ffmpeg_codec_context_get_flags)
  V("setCodecContextFlags", bare_ffmpeg_codec_context_set_flags)
  V("getCodecContextPixelFormat", bare_ffmpeg_codec_context_get_pixel_format)
  V("setCodecContextPixelFormat", bare_ffmpeg_codec_context_set_pixel_format)
  V("getCodecContextWidth", bare_ffmpeg_codec_context_get_width)
  V("setCodecContextWidth", bare_ffmpeg_codec_context_set_width)
  V("getCodecContextHeight", bare_ffmpeg_codec_context_get_height)
  V("setCodecContextHeight", bare_ffmpeg_codec_context_set_height)
  V("getCodecContextSampleFormat", bare_ffmpeg_codec_context_get_sample_format)
  V("setCodecContextSampleFormat", bare_ffmpeg_codec_context_set_sample_format)
  V("getCodecContextTimeBase", bare_ffmpeg_codec_context_get_time_base)
  V("setCodecContextTimeBase", bare_ffmpeg_codec_context_set_time_base)
  V("getCodecContextChannelLayout", bare_ffmpeg_codec_context_get_channel_layout);
  V("setCodecContextChannelLayout", bare_ffmpeg_codec_context_set_channel_layout);
  V("getCodecContextSampleRate", bare_ffmpeg_codec_context_get_sample_rate);
  V("setCodecContextSampleRate", bare_ffmpeg_codec_context_set_sample_rate);
  V("getCodecContextGOPSize", bare_ffmpeg_codec_context_get_gop_size)
  V("setCodecContextGOPSize", bare_ffmpeg_codec_context_set_gop_size)
  V("getCodecContextFramerate", bare_ffmpeg_codec_context_get_framerate)
  V("setCodecContextFramerate", bare_ffmpeg_codec_context_set_framerate)
  V("getCodecContextExtraData", bare_ffmpeg_codec_context_get_extra_data)
  V("setCodecContextExtraData", bare_ffmpeg_codec_context_set_extra_data)
  V("getCodecContextFrameSize", bare_ffmpeg_codec_context_get_frame_size)
  V("getCodecContextFrameNum", bare_ffmpeg_codec_context_get_frame_num)

  V("sendCodecContextPacket", bare_ffmpeg_codec_context_send_packet)
  V("receiveCodecContextPacket", bare_ffmpeg_codec_context_receive_packet)
  V("sendCodecContextFrame", bare_ffmpeg_codec_context_send_frame)
  V("receiveCodecContextFrame", bare_ffmpeg_codec_context_receive_frame)

  V("codecParametersFromContext", bare_ffmpeg_codec_parameters_from_context)
  V("codecParametersToContext", bare_ffmpeg_codec_parameters_to_context)
  V("allocCodecParameters", bare_ffmpeg_codec_parameters_alloc)
  V("destroyCodecParameters", bare_ffmpeg_codec_parameters_destroy)
  V("getCodecParametersBitRate", bare_ffmpeg_codec_parameters_get_bit_rate)
  V("setCodecParametersBitRate", bare_ffmpeg_codec_parameters_set_bit_rate)
  V("getCodecParametersBitsPerCodedSample", bare_ffmpeg_codec_parameters_get_bits_per_coded_sample)
  V("setCodecParametersBitsPerCodedSample", bare_ffmpeg_codec_parameters_set_bits_per_coded_sample)
  V("getCodecParametersBitsPerRawSample", bare_ffmpeg_codec_parameters_get_bits_per_raw_sample)
  V("setCodecParametersBitsPerRawSample", bare_ffmpeg_codec_parameters_set_bits_per_raw_sample)
  V("getCodecParametersSampleRate", bare_ffmpeg_codec_parameters_get_sample_rate)
  V("setCodecParametersSampleRate", bare_ffmpeg_codec_parameters_set_sample_rate)
  V("getCodecParametersFramerate", bare_ffmpeg_codec_parameters_get_framerate)
  V("setCodecParametersFramerate", bare_ffmpeg_codec_parameters_set_framerate)
  V("getCodecParametersNbChannels", bare_ffmpeg_codec_parameters_get_nb_channels)
  V("setCodecParametersNbChannels", bare_ffmpeg_codec_parameters_set_nb_channels)
  V("getCodecParametersType", bare_ffmpeg_codec_parameters_get_type)
  V("setCodecParametersType", bare_ffmpeg_codec_parameters_set_type)
  V("getCodecParametersTag", bare_ffmpeg_codec_parameters_get_tag)
  V("setCodecParametersTag", bare_ffmpeg_codec_parameters_set_tag)
  V("getCodecParametersId", bare_ffmpeg_codec_parameters_get_id)
  V("setCodecParametersId", bare_ffmpeg_codec_parameters_set_id)
  V("getCodecParametersLevel", bare_ffmpeg_codec_parameters_get_level)
  V("setCodecParametersLevel", bare_ffmpeg_codec_parameters_set_level)
  V("getCodecParametersProfile", bare_ffmpeg_codec_parameters_get_profile)
  V("setCodecParametersProfile", bare_ffmpeg_codec_parameters_set_profile)
  V("getCodecParametersFormat", bare_ffmpeg_codec_parameters_get_format)
  V("setCodecParametersFormat", bare_ffmpeg_codec_parameters_set_format)
  V("getCodecParametersChannelLayout", bare_ffmpeg_codec_parameters_get_channel_layout)
  V("setCodecParametersChannelLayout", bare_ffmpeg_codec_parameters_set_channel_layout)
  V("getCodecParametersWidth", bare_ffmpeg_codec_parameters_get_width)
  V("setCodecParametersWidth", bare_ffmpeg_codec_parameters_set_width)
  V("getCodecParametersHeight", bare_ffmpeg_codec_parameters_get_height)
  V("setCodecParametersHeight", bare_ffmpeg_codec_parameters_set_height)
  V("getCodecParametersExtraData", bare_ffmpeg_codec_parameters_get_extra_data)
  V("setCodecParametersExtraData", bare_ffmpeg_codec_parameters_set_extra_data)
  V("getCodecParametersBlockAlign", bare_ffmpeg_codec_parameters_get_block_align)
  V("setCodecParametersBlockAlign", bare_ffmpeg_codec_parameters_set_block_align)
  V("getCodecParametersInitialPadding", bare_ffmpeg_codec_parameters_get_initial_padding)
  V("setCodecParametersInitialPadding", bare_ffmpeg_codec_parameters_set_initial_padding)
  V("getCodecParametersTrailingPadding", bare_ffmpeg_codec_parameters_get_trailing_padding)
  V("setCodecParametersTrailingPadding", bare_ffmpeg_codec_parameters_set_trailing_padding)
  V("getCodecParametersSeekPreroll", bare_ffmpeg_codec_parameters_get_seek_preroll)
  V("setCodecParametersSeekPreroll", bare_ffmpeg_codec_parameters_set_seek_preroll)
  V("getCodecParametersSampleAspectRatio", bare_ffmpeg_codec_parameters_get_sample_aspect_ratio)
  V("setCodecParametersSampleAspectRatio", bare_ffmpeg_codec_parameters_set_sample_aspect_ratio)
  V("getCodecParametersVideoDelay", bare_ffmpeg_codec_parameters_get_video_delay)
  V("setCodecParametersVideoDelay", bare_ffmpeg_codec_parameters_set_video_delay)
  V("getCodecParametersFrameSize", bare_ffmpeg_codec_parameters_get_frame_size)
  V("setCodecParametersFrameSize", bare_ffmpeg_codec_parameters_set_frame_size)

  V("initFrame", bare_ffmpeg_frame_init)
  V("destroyFrame", bare_ffmpeg_frame_destroy)
  V("unrefFrame", bare_ffmpeg_frame_unref)
  V("getFrameWidth", bare_ffmpeg_frame_get_width)
  V("setFrameWidth", bare_ffmpeg_frame_set_width)
  V("getFrameHeight", bare_ffmpeg_frame_get_height)
  V("setFrameHeight", bare_ffmpeg_frame_set_height)
  V("getFrameFormat", bare_ffmpeg_frame_get_format)
  V("setFrameFormat", bare_ffmpeg_frame_set_format)
  V("getFrameChannelLayout", bare_ffmpeg_frame_get_channel_layout)
  V("setFrameChannelLayout", bare_ffmpeg_frame_set_channel_layout)
  V("getFrameNbSamples", bare_ffmpeg_frame_get_nb_samples)
  V("setFrameNbSamples", bare_ffmpeg_frame_set_nb_samples)
  V("getFramePictType", bare_ffmpeg_frame_get_pict_type)
  V("getFramePTS", bare_ffmpeg_frame_get_pts)
  V("setFramePTS", bare_ffmpeg_frame_set_pts)
  V("getFramePacketDTS", bare_ffmpeg_frame_get_pkt_dts)
  V("setFramePacketDTS", bare_ffmpeg_frame_set_pkt_dts)
  V("getFrameTimeBase", bare_ffmpeg_frame_get_time_base)
  V("setFrameTimeBase", bare_ffmpeg_frame_set_time_base)
  V("getFrameSampleRate", bare_ffmpeg_frame_get_sample_rate)
  V("setFrameSampleRate", bare_ffmpeg_frame_set_sample_rate)
  V("copyFrameProperties", bare_ffmpeg_frame_copy_properties)
  V("allocFrame", bare_ffmpeg_frame_alloc)

  V("initImage", bare_ffmpeg_image_init)
  V("fillImage", bare_ffmpeg_image_fill)
  V("readImage", bare_ffmpeg_image_read)
  V("getImageLineSize", bare_ffmpeg_image_get_line_size)

  V("samplesBufferSize", bare_ffmpeg_samples_buffer_size)
  V("fillSamples", bare_ffmpeg_samples_fill)
  V("readSamples", bare_ffmpeg_samples_read)

  V("initPacket", bare_ffmpeg_packet_init)
  V("initPacketFromBuffer", bare_ffmpeg_packet_init_from_buffer)
  V("destroyPacket", bare_ffmpeg_packet_destroy)
  V("unrefPacket", bare_ffmpeg_packet_unref)
  V("getPacketStreamIndex", bare_ffmpeg_packet_get_stream_index)
  V("setPacketStreamIndex", bare_ffmpeg_packet_set_stream_index)
  V("getPacketData", bare_ffmpeg_packet_get_data)
  V("setPacketData", bare_ffmpeg_packet_set_data)
  V("getPacketSideData", bare_ffmpeg_packet_get_side_data)
  V("setPacketSideData", bare_ffmpeg_packet_set_side_data)
  V("isPacketKeyframe", bare_ffmpeg_packet_is_keyframe)
  V("setPacketIsKeyFrame", bare_ffmpeg_packet_set_is_keyframe)
  V("getPacketDTS", bare_ffmpeg_packet_get_dts)
  V("setPacketDTS", bare_ffmpeg_packet_set_dts)
  V("getPacketPTS", bare_ffmpeg_packet_get_pts)
  V("setPacketPTS", bare_ffmpeg_packet_set_pts)
  V("getPacketTimeBase", bare_ffmpeg_packet_get_time_base)
  V("setPacketTimeBase", bare_ffmpeg_packet_set_time_base)
  V("rescalePacketTimestamps", bare_ffmpeg_packet_rescale_ts)
  V("getPacketDuration", bare_ffmpeg_packet_get_duration)
  V("setPacketDuration", bare_ffmpeg_packet_set_duration)
  V("getPacketFlags", bare_ffmpeg_packet_get_flags)
  V("setPacketFlags", bare_ffmpeg_packet_set_flags)
  V("copyPacketProps", bare_ffmpeg_packet_copy_props)

  V("getSideDataType", bare_ffmpeg_side_data_get_type)
  V("getSideDataName", bare_ffmpeg_side_data_get_name)
  V("getSideDataBuffer", bare_ffmpeg_side_data_get_data)

  V("initScaler", bare_ffmpeg_scaler_init)
  V("destroyScaler", bare_ffmpeg_scaler_destroy)
  V("scaleScaler", bare_ffmpeg_scaler_scale)

  V("initDictionary", bare_ffmpeg_dictionary_init)
  V("destroyDictionary", bare_ffmpeg_dictionary_destroy)
  V("getDictionaryEntry", bare_ffmpeg_dictionary_get_entry)
  V("setDictionaryEntry", bare_ffmpeg_dictionary_set_entry)
  V("getDictionaryEntries", bare_ffmpeg_dictionary_get_entries)

  V("initResampler", bare_ffmpeg_resampler_init)
  V("destroyResampler", bare_ffmpeg_resampler_destroy)
  V("convertResampler", bare_ffmpeg_resampler_convert_frames)
  V("getResamplerDelay", bare_ffmpeg_resampler_get_delay)
  V("flushResampler", bare_ffmpeg_resampler_flush)

  V("copyChannelLayout", bare_ffmpeg_channel_layout_copy)
  V("getChannelLayoutNbChannels", bare_ffmpeg_channel_layout_get_nb_channels)
  V("getChannelLayoutMask", bare_ffmpeg_channel_layout_get_mask)
  V("channelLayoutFromMask", bare_ffmpeg_channel_layout_from_mask)

  V("initAudioFifo", bare_ffmpeg_audio_fifo_init)
  V("destroyAudioFifo", bare_ffmpeg_audio_fifo_destroy)
  V("writeAudioFifo", bare_ffmpeg_audio_fifo_write)
  V("readAudioFifo", bare_ffmpeg_audio_fifo_read)
  V("peekAudioFifo", bare_ffmpeg_audio_fifo_peek)
  V("drainAudioFifo", bare_ffmpeg_audio_fifo_drain)
  V("resetAudioFifo", bare_ffmpeg_audio_fifo_reset)
  V("getAudioFifoSize", bare_ffmpeg_audio_fifo_size)
  V("getAudioFifoSpace", bare_ffmpeg_audio_fifo_space)

  V("rationalD2Q", bare_ffmpeg_rational_d2q)
  V("rationalRescaleQ", bare_ffmpeg_rational_rescale_q)

  V("getFilterByName", bare_ffmpeg_filter_get_by_name)

  V("initFilterContext", bare_ffmpeg_filter_context_init)

  V("initFilterGraph", bare_ffmpeg_filter_graph_init)
  V("destroyFilterGraph", bare_ffmpeg_filter_graph_destroy)
  V("createFilterGraphFilter", bare_ffmpeg_filter_graph_create_filter)
  V("parseFilterGraph", bare_ffmpeg_filter_graph_parse)
  V("configureFilterGraph", bare_ffmpeg_filter_graph_configure)
  V("pushFilterGraphFrame", bare_ffmpeg_filter_graph_push_frame)
  V("pullFilterGraphFrame", bare_ffmpeg_filter_graph_pull_frame)

  V("initFilterInout", bare_ffmpeg_filter_inout_init)
  V("destroyFilterInOut", bare_ffmpeg_filter_inout_destroy)
  V("getFilterInOutName", bare_ffmpeg_filter_inout_get_name)
  V("setFilterInOutName", bare_ffmpeg_filter_inout_set_name)
  V("setFilterInOutFilterContext", bare_ffmpeg_filter_inout_set_filter_context)
  V("getFilterInOutPadIdx", bare_ffmpeg_filter_inout_get_pad_idx)
  V("setFilterInOutPadIdx", bare_ffmpeg_filter_inout_set_pad_idx)
  V("setFilterInOutNext", bare_ffmpeg_filter_inout_set_next)
#undef V

#define V(name) \
  { \
    js_value_t *val; \
    err = js_create_int64(env, name, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, #name, val); \
    assert(err == 0); \
  }

  V(AV_LOG_QUIET)
  V(AV_LOG_PANIC)
  V(AV_LOG_FATAL)
  V(AV_LOG_ERROR)
  V(AV_LOG_WARNING)
  V(AV_LOG_INFO)
  V(AV_LOG_VERBOSE)
  V(AV_LOG_DEBUG)
  V(AV_LOG_TRACE)

  V(AV_CODEC_ID_MJPEG)
  V(AV_CODEC_ID_H264)
  V(AV_CODEC_ID_AAC)
  V(AV_CODEC_ID_OPUS)
  V(AV_CODEC_ID_AV1)
  V(AV_CODEC_ID_FLAC)
  V(AV_CODEC_ID_MP3)

  V(AV_CODEC_FLAG_COPY_OPAQUE)
  V(AV_CODEC_FLAG_FRAME_DURATION)
  V(AV_CODEC_FLAG_PASS1)
  V(AV_CODEC_FLAG_PASS2)
  V(AV_CODEC_FLAG_LOOP_FILTER)
  V(AV_CODEC_FLAG_GRAY)
  V(AV_CODEC_FLAG_PSNR)
  V(AV_CODEC_FLAG_INTERLACED_DCT)
  V(AV_CODEC_FLAG_LOW_DELAY)
  V(AV_CODEC_FLAG_GLOBAL_HEADER)
  V(AV_CODEC_FLAG_BITEXACT)
  V(AV_CODEC_FLAG_AC_PRED)
  V(AV_CODEC_FLAG_INTERLACED_ME)
  V(AV_CODEC_FLAG_CLOSED_GOP)

  V(AV_PIX_FMT_RGBA)
  V(AV_PIX_FMT_RGB24)
  V(AV_PIX_FMT_YUVJ420P)
  V(AV_PIX_FMT_YUV420P)
  V(AV_PIX_FMT_UYVY422)

  V(AVMEDIA_TYPE_UNKNOWN)
  V(AVMEDIA_TYPE_VIDEO)
  V(AVMEDIA_TYPE_AUDIO)
  V(AVMEDIA_TYPE_DATA)
  V(AVMEDIA_TYPE_SUBTITLE)
  V(AVMEDIA_TYPE_ATTACHMENT)
  V(AVMEDIA_TYPE_NB)

  V(AV_SAMPLE_FMT_NONE)
  V(AV_SAMPLE_FMT_U8)
  V(AV_SAMPLE_FMT_S16)
  V(AV_SAMPLE_FMT_S32)
  V(AV_SAMPLE_FMT_FLT)
  V(AV_SAMPLE_FMT_DBL)
  V(AV_SAMPLE_FMT_U8P)
  V(AV_SAMPLE_FMT_S16P)
  V(AV_SAMPLE_FMT_S32P)
  V(AV_SAMPLE_FMT_FLTP)
  V(AV_SAMPLE_FMT_DBLP)
  V(AV_SAMPLE_FMT_S64)
  V(AV_SAMPLE_FMT_S64P)
  V(AV_SAMPLE_FMT_NB)

  V(AV_CH_LAYOUT_MONO)
  V(AV_CH_LAYOUT_STEREO)
  V(AV_CH_LAYOUT_QUAD)
  V(AV_CH_LAYOUT_SURROUND)
  V(AV_CH_LAYOUT_2POINT1)
  V(AV_CH_LAYOUT_5POINT0)
  V(AV_CH_LAYOUT_5POINT1)
  V(AV_CH_LAYOUT_7POINT1)

  V(AV_PICTURE_TYPE_NONE)
  V(AV_PICTURE_TYPE_I)
  V(AV_PICTURE_TYPE_P)
  V(AV_PICTURE_TYPE_B)
  V(AV_PICTURE_TYPE_S)
  V(AV_PICTURE_TYPE_SI)
  V(AV_PICTURE_TYPE_SP)
  V(AV_PICTURE_TYPE_BI)

  // InputFormat flags
  V(AVFMT_SHOW_IDS)
  V(AVFMT_GENERIC_INDEX)
  V(AVFMT_TS_DISCONT)
  V(AVFMT_NOBINSEARCH)
  V(AVFMT_NOGENSEARCH)
  V(AVFMT_NO_BYTE_SEEK)
  V(AVFMT_SEEK_TO_PTS)

  // OutputFormat flags
  V(AVFMT_GLOBALHEADER)
  V(AVFMT_VARIABLE_FPS)
  V(AVFMT_NODIMENSIONS)
  V(AVFMT_NOSTREAMS)
  V(AVFMT_TS_NONSTRICT)
  V(AVFMT_TS_NEGATIVE)

  // Common format flags
  V(AVFMT_NOFILE)
  V(AVFMT_NEEDNUMBER)
  V(AVFMT_NOTIMESTAMPS)

  // Profile
  V(AV_PROFILE_UNKNOWN)
  V(AV_PROFILE_RESERVED)
  V(AV_PROFILE_AAC_MAIN)
  V(AV_PROFILE_AAC_LOW)
  V(AV_PROFILE_AAC_SSR)
  V(AV_PROFILE_AAC_LTP)
  V(AV_PROFILE_AAC_HE)
  V(AV_PROFILE_AAC_HE_V2)
  V(AV_PROFILE_AAC_LD)
  V(AV_PROFILE_AAC_ELD)
  V(AV_PROFILE_AAC_USAC)
  V(AV_PROFILE_MPEG2_AAC_LOW)
  V(AV_PROFILE_MPEG2_AAC_HE)
  V(AV_PROFILE_DNXHD)
  V(AV_PROFILE_DNXHR_LB)
  V(AV_PROFILE_DNXHR_SQ)
  V(AV_PROFILE_DNXHR_HQ)
  V(AV_PROFILE_DNXHR_HQX)
  V(AV_PROFILE_DNXHR_444)
  V(AV_PROFILE_DTS)
  V(AV_PROFILE_DTS_ES)
  V(AV_PROFILE_DTS_96_24)
  V(AV_PROFILE_DTS_HD_HRA)
  V(AV_PROFILE_DTS_HD_MA)
  V(AV_PROFILE_DTS_EXPRESS)
  V(AV_PROFILE_DTS_HD_MA_X)
  V(AV_PROFILE_DTS_HD_MA_X_IMAX)
  V(AV_PROFILE_EAC3_DDP_ATMOS)
  V(AV_PROFILE_TRUEHD_ATMOS)
  V(AV_PROFILE_MPEG2_422)
  V(AV_PROFILE_MPEG2_HIGH)
  V(AV_PROFILE_MPEG2_SS)
  V(AV_PROFILE_MPEG2_SNR_SCALABLE)
  V(AV_PROFILE_MPEG2_MAIN)
  V(AV_PROFILE_MPEG2_SIMPLE)
  V(AV_PROFILE_H264_CONSTRAINED)
  V(AV_PROFILE_H264_INTRA)
  V(AV_PROFILE_H264_BASELINE)
  V(AV_PROFILE_H264_CONSTRAINED_BASELINE)
  V(AV_PROFILE_H264_MAIN)
  V(AV_PROFILE_H264_EXTENDED)
  V(AV_PROFILE_H264_HIGH)
  V(AV_PROFILE_H264_HIGH_10)
  V(AV_PROFILE_H264_HIGH_10_INTRA)
  V(AV_PROFILE_H264_MULTIVIEW_HIGH)
  V(AV_PROFILE_H264_HIGH_422)
  V(AV_PROFILE_H264_HIGH_422_INTRA)
  V(AV_PROFILE_H264_STEREO_HIGH)
  V(AV_PROFILE_H264_HIGH_444)
  V(AV_PROFILE_H264_HIGH_444_PREDICTIVE)
  V(AV_PROFILE_H264_HIGH_444_INTRA)
  V(AV_PROFILE_H264_CAVLC_444)
  V(AV_PROFILE_VC1_SIMPLE)
  V(AV_PROFILE_VC1_MAIN)
  V(AV_PROFILE_VC1_COMPLEX)
  V(AV_PROFILE_VC1_ADVANCED)
  V(AV_PROFILE_MPEG4_SIMPLE)
  V(AV_PROFILE_MPEG4_SIMPLE_SCALABLE)
  V(AV_PROFILE_MPEG4_CORE)
  V(AV_PROFILE_MPEG4_MAIN)
  V(AV_PROFILE_MPEG4_N_BIT)
  V(AV_PROFILE_MPEG4_SCALABLE_TEXTURE)
  V(AV_PROFILE_MPEG4_SIMPLE_FACE_ANIMATION)
  V(AV_PROFILE_MPEG4_BASIC_ANIMATED_TEXTURE)
  V(AV_PROFILE_MPEG4_HYBRID)
  V(AV_PROFILE_MPEG4_ADVANCED_REAL_TIME)
  V(AV_PROFILE_MPEG4_CORE_SCALABLE)
  V(AV_PROFILE_MPEG4_ADVANCED_CODING)
  V(AV_PROFILE_MPEG4_ADVANCED_CORE)
  V(AV_PROFILE_MPEG4_ADVANCED_SCALABLE_TEXTURE)
  V(AV_PROFILE_MPEG4_SIMPLE_STUDIO)
  V(AV_PROFILE_MPEG4_ADVANCED_SIMPLE)
  V(AV_PROFILE_JPEG2000_CSTREAM_RESTRICTION_0)
  V(AV_PROFILE_JPEG2000_CSTREAM_RESTRICTION_1)
  V(AV_PROFILE_JPEG2000_CSTREAM_NO_RESTRICTION)
  V(AV_PROFILE_JPEG2000_DCINEMA_2K)
  V(AV_PROFILE_JPEG2000_DCINEMA_4K)
  V(AV_PROFILE_VP9_0)
  V(AV_PROFILE_VP9_1)
  V(AV_PROFILE_VP9_2)
  V(AV_PROFILE_VP9_3)
  V(AV_PROFILE_HEVC_MAIN)
  V(AV_PROFILE_HEVC_MAIN_10)
  V(AV_PROFILE_HEVC_MAIN_STILL_PICTURE)
  V(AV_PROFILE_HEVC_REXT)
  V(AV_PROFILE_HEVC_MULTIVIEW_MAIN)
  V(AV_PROFILE_HEVC_SCC)
  V(AV_PROFILE_VVC_MAIN_10)
  V(AV_PROFILE_VVC_MAIN_10_444)
  V(AV_PROFILE_AV1_MAIN)
  V(AV_PROFILE_AV1_HIGH)
  V(AV_PROFILE_AV1_PROFESSIONAL)
  V(AV_PROFILE_MJPEG_HUFFMAN_BASELINE_DCT)
  V(AV_PROFILE_MJPEG_HUFFMAN_EXTENDED_SEQUENTIAL_DCT)
  V(AV_PROFILE_MJPEG_HUFFMAN_PROGRESSIVE_DCT)
  V(AV_PROFILE_MJPEG_HUFFMAN_LOSSLESS)
  V(AV_PROFILE_MJPEG_JPEG_LS)
  V(AV_PROFILE_SBC_MSBC)
  V(AV_PROFILE_PRORES_PROXY)
  V(AV_PROFILE_PRORES_LT)
  V(AV_PROFILE_PRORES_STANDARD)
  V(AV_PROFILE_PRORES_HQ)
  V(AV_PROFILE_PRORES_4444)
  V(AV_PROFILE_PRORES_XQ)
  V(AV_PROFILE_ARIB_PROFILE_A)
  V(AV_PROFILE_ARIB_PROFILE_C)
  V(AV_PROFILE_KLVA_SYNC)
  V(AV_PROFILE_KLVA_ASYNC)
  V(AV_PROFILE_EVC_BASELINE)
  V(AV_PROFILE_EVC_MAIN)

  // Levels
  V(AV_LEVEL_UNKNOWN)

  // SEEK
  V(AVSEEK_SIZE)
  V(AVSEEK_FORCE)
  V(SEEK_CUR)
  V(SEEK_SET)
  V(SEEK_END)

  V(AV_PKT_DATA_PALETTE)
  V(AV_PKT_DATA_NEW_EXTRADATA)
  V(AV_PKT_DATA_PARAM_CHANGE)
  V(AV_PKT_DATA_H263_MB_INFO)
  V(AV_PKT_DATA_REPLAYGAIN)
  V(AV_PKT_DATA_DISPLAYMATRIX)
  V(AV_PKT_DATA_STEREO3D)
  V(AV_PKT_DATA_AUDIO_SERVICE_TYPE)
  V(AV_PKT_DATA_QUALITY_STATS)
  V(AV_PKT_DATA_FALLBACK_TRACK)
  V(AV_PKT_DATA_CPB_PROPERTIES)
  V(AV_PKT_DATA_SKIP_SAMPLES)
  V(AV_PKT_DATA_JP_DUALMONO)
  V(AV_PKT_DATA_STRINGS_METADATA)
  V(AV_PKT_DATA_SUBTITLE_POSITION)
  V(AV_PKT_DATA_MATROSKA_BLOCKADDITIONAL)
  V(AV_PKT_DATA_WEBVTT_IDENTIFIER)
  V(AV_PKT_DATA_WEBVTT_SETTINGS)
  V(AV_PKT_DATA_METADATA_UPDATE)
  V(AV_PKT_DATA_MPEGTS_STREAM_ID)
  V(AV_PKT_DATA_MASTERING_DISPLAY_METADATA)
  V(AV_PKT_DATA_SPHERICAL)
  V(AV_PKT_DATA_CONTENT_LIGHT_LEVEL)
  V(AV_PKT_DATA_A53_CC)
  V(AV_PKT_DATA_ENCRYPTION_INIT_INFO)
  V(AV_PKT_DATA_ENCRYPTION_INFO)
  V(AV_PKT_DATA_AFD)
  V(AV_PKT_DATA_PRFT)
  V(AV_PKT_DATA_ICC_PROFILE)
  V(AV_PKT_DATA_DOVI_CONF)
  V(AV_PKT_DATA_S12M_TIMECODE)
  V(AV_PKT_DATA_DYNAMIC_HDR10_PLUS)
  V(AV_PKT_DATA_IAMF_MIX_GAIN_PARAM)
  V(AV_PKT_DATA_IAMF_DEMIXING_INFO_PARAM)
  V(AV_PKT_DATA_IAMF_RECON_GAIN_INFO_PARAM)
  V(AV_PKT_DATA_AMBIENT_VIEWING_ENVIRONMENT)
  V(AV_PKT_DATA_FRAME_CROPPING)
  V(AV_PKT_DATA_LCEVC)
  V(AV_PKT_DATA_3D_REFERENCE_DISPLAYS)
  V(AV_PKT_DATA_RTCP_SR)
  V(AV_PKT_DATA_NB)

  V(AV_CODEC_CONFIG_PIX_FORMAT)
  V(AV_CODEC_CONFIG_FRAME_RATE)
  V(AV_CODEC_CONFIG_SAMPLE_RATE)
  V(AV_CODEC_CONFIG_SAMPLE_FORMAT)
  V(AV_CODEC_CONFIG_CHANNEL_LAYOUT)
  V(AV_CODEC_CONFIG_COLOR_RANGE)
  V(AV_CODEC_CONFIG_COLOR_SPACE)

  V(AV_ROUND_ZERO)
  V(AV_ROUND_INF)
  V(AV_ROUND_DOWN)
  V(AV_ROUND_UP)
  V(AV_ROUND_NEAR_INF) // default
  V(AV_ROUND_PASS_MINMAX)
#undef V

  return exports;
}

BARE_MODULE(bare_ffmpeg, bare_ffmpeg_exports)
