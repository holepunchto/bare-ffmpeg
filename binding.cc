#include <assert.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include <bare.h>
#include <js.h>
#include <jstl.h>

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavcodec/codec.h>
#include <libavcodec/codec_id.h>
#include <libavcodec/codec_par.h>
#include <libavcodec/packet.h>
#include <libavdevice/avdevice.h>
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

typedef struct {
  AVIOContext *handle;
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

static uv_once_t bare_ffmpeg__init_guard = UV_ONCE_INIT;

static void
bare_ffmpeg__on_init(void) {
  av_log_set_level(AV_LOG_ERROR);

  avdevice_register_all();
}

static js_arraybuffer_t
bare_ffmpeg_io_context_init(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_t data,
  uint64_t offset,
  uint64_t len
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_io_context_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  uint8_t *io;
  size_t size = static_cast<size_t>(len);

  if (len == 0) io = NULL;
  else {
    io = reinterpret_cast<uint8_t *>(av_malloc(size));

    memcpy(io, &data[static_cast<size_t>(offset)], size);
  }

  context->handle = avio_alloc_context(io, static_cast<int>(len), 0, NULL, NULL, NULL, NULL);
  context->handle->opaque = (void *) context;

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

  uint32_t len = context->handle->nb_streams;

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
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_t, 1> codec
) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_stream_t *stream;
  err = js_create_arraybuffer(env, stream, handle);
  assert(err == 0);

  stream->handle = avformat_new_stream(context->handle, codec->handle);

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

  if (av_q2d(packet->handle->time_base) == 0) {
    packet->handle->time_base = context->handle->streams[packet->handle->stream_index]->time_base;
  }

  return err == 0;
}

static int32_t
bare_ffmpeg_stream_get_codec(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_stream_t, 1> stream
) {
  return stream->handle->codecpar->codec_id;
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

static int64_t
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
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int err;

  err = avcodec_send_frame(context->handle, frame->handle);
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

  if (av_q2d(frame->handle->time_base) == 0) {
    frame->handle->time_base = context->handle->time_base;
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

static int64_t
bare_ffmpeg_codec_parameters_get_bit_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->bit_rate;
}

static int64_t
bare_ffmpeg_codec_parameters_get_bits_per_coded_sample(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->bits_per_coded_sample;
}

static int64_t
bare_ffmpeg_codec_parameters_get_bits_per_raw_sample(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->bits_per_raw_sample;
}

static int
bare_ffmpeg_codec_parameters_get_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->format;
}

static int64_t
bare_ffmpeg_codec_parameters_get_sample_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->sample_rate;
}

static int64_t
bare_ffmpeg_codec_parameters_get_nb_channels(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->ch_layout.nb_channels;
}

static int64_t
bare_ffmpeg_codec_parameters_get_codec_type(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->codec_type;
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

static int64_t
bare_ffmpeg_frame_get_pixel_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  return frame->handle->format;
}

static void
bare_ffmpeg_frame_set_pixel_format(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int32_t format
) {
  frame->handle->format = static_cast<AVPixelFormat>(format);
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

  assert(ts >= 0 || ts == AV_NOPTS_VALUE);

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

static int64_t
bare_ffmpeg_frame_pts_for_timebase(
  js_env_t *env,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int32_t num,
  int32_t den
) {
  int64_t ts = frame->handle->pts;

  assert(ts >= 0 || ts == AV_NOPTS_VALUE);

  if (ts == AV_NOPTS_VALUE) return -1;

  AVRational target_base = {.num = num, .den = den};

  return av_rescale_q(ts, frame->handle->time_base, target_base);
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

static js_arraybuffer_t
bare_ffmpeg_samples_init(
  js_env_t *env,
  js_receiver_t,
  int32_t sample_format,
  int32_t nb_channels,
  int32_t nb_samples,
  int32_t align
) {
  int err;

  auto len = av_samples_get_buffer_size(
    NULL,
    nb_channels,
    nb_samples,
    static_cast<AVSampleFormat>(sample_format),
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

static int
bare_ffmpeg_samples_fill(
  js_env_t *env,
  js_receiver_t,
  int32_t sample_format,
  int32_t nb_channels,
  int32_t nb_samples,
  int32_t align,
  js_arraybuffer_span_t data,
  uint64_t offset,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int err;

  auto len = av_samples_fill_arrays(
    frame->handle->data,
    frame->handle->linesize,
    &data[static_cast<size_t>(offset)],
    nb_channels,
    nb_samples,
    static_cast<AVSampleFormat>(sample_format),
    align
  );

  if (len < 0) {
    err = js_throw_error(env, NULL, av_err2str(len));
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

static int64_t
bare_ffmpeg_packet_get_dts(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int64_t ts = packet->handle->dts;

  assert(ts >= 0 || ts == AV_NOPTS_VALUE);
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

  assert(ts >= 0 || ts == AV_NOPTS_VALUE);

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

static int64_t
bare_ffmpeg_packet_dts_for_timebase(
  js_env_t *env,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  int32_t num,
  int32_t den
) {
  int64_t ts = packet->handle->dts;

  assert(ts >= 0 || ts == AV_NOPTS_VALUE);

  if (ts == AV_NOPTS_VALUE) return -1;

  AVRational target_base = {.num = num, .den = den};

  return av_rescale_q(ts, packet->handle->time_base, target_base);
}

static int64_t
bare_ffmpeg_packet_pts_for_timebase(
  js_env_t *env,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet,
  int32_t num,
  int32_t den
) {
  int64_t ts = packet->handle->pts;

  assert(ts >= 0 || ts == AV_NOPTS_VALUE);

  if (ts == AV_NOPTS_VALUE) return -1;

  AVRational target_base = {.num = num, .den = den};

  return av_rescale_q(ts, packet->handle->time_base, target_base);
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

static bool
bare_ffmpeg_packet_is_keyframe(
  js_env_t *,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  return packet->handle->flags & AV_PKT_FLAG_KEY;
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
  int err = av_frame_copy_props(target->handle, source->handle);
  assert(err == 0);

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

  out_frame->handle->nb_samples = result;

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

  int len = av_audio_fifo_write(fifo->handle, (void **) frame->handle->data, frame->handle->nb_samples);

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

  int len = av_audio_fifo_read(fifo->handle, (void **) frame->handle->data, nb_samples);

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

  int len = av_audio_fifo_peek(fifo->handle, (void **) frame->handle->data, nb_samples);

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

  int len = av_audio_fifo_drain(fifo->handle, nb_samples);

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

static js_value_t *
bare_ffmpeg_exports(js_env_t *env, js_value_t *exports) {
  uv_once(&bare_ffmpeg__init_guard, bare_ffmpeg__on_init);

  int err;

#define V(name, fn) \
  err = js_set_property<fn>(env, exports, name); \
  assert(err == 0);

  V("initIOContext", bare_ffmpeg_io_context_init)
  V("destroyIOContext", bare_ffmpeg_io_context_destroy)

  V("initOutputFormat", bare_ffmpeg_output_format_init)
  V("initInputFormat", bare_ffmpeg_input_format_init)

  V("openInputFormatContextWithIO", bare_ffmpeg_format_context_open_input_with_io)
  V("openInputFormatContextWithFormat", bare_ffmpeg_format_context_open_input_with_format)
  V("closeInputFormatContext", bare_ffmpeg_format_context_close_input)
  V("openOutputFormatContext", bare_ffmpeg_format_context_open_output)
  V("closeOutputFormatContext", bare_ffmpeg_format_context_close_output)
  V("getFormatContextStreams", bare_ffmpeg_format_context_get_streams)
  V("getFormatContextBestStreamIndex", bare_ffmpeg_format_context_get_best_stream_index)
  V("createFormatContextStream", bare_ffmpeg_format_context_create_stream)
  V("readFormatContextFrame", bare_ffmpeg_format_context_read_frame)

  V("getStreamCodec", bare_ffmpeg_stream_get_codec)
  V("getStreamCodecParameters", bare_ffmpeg_stream_get_codec_parameters)
  V("getStreamTimeBase", bare_ffmpeg_stream_get_time_base)

  V("findDecoderByID", bare_ffmpeg_find_decoder_by_id)
  V("findEncoderByID", bare_ffmpeg_find_encoder_by_id)

  V("initCodecContext", bare_ffmpeg_codec_context_init)
  V("destroyCodecContext", bare_ffmpeg_codec_context_destroy)
  V("openCodecContext", bare_ffmpeg_codec_context_open)
  V("openCodecContextWithOptions", bare_ffmpeg_codec_context_open_with_options)
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

  V("sendCodecContextPacket", bare_ffmpeg_codec_context_send_packet)
  V("receiveCodecContextPacket", bare_ffmpeg_codec_context_receive_packet)
  V("sendCodecContextFrame", bare_ffmpeg_codec_context_send_frame)
  V("receiveCodecContextFrame", bare_ffmpeg_codec_context_receive_frame)

  V("codecParametersFromContext", bare_ffmpeg_codec_parameters_from_context)
  V("codecParametersToContext", bare_ffmpeg_codec_parameters_to_context)
  V("getCodecParametersBitRate", bare_ffmpeg_codec_parameters_get_bit_rate)
  V("getCodecParametersBitsPerCodedSample", bare_ffmpeg_codec_parameters_get_bits_per_coded_sample)
  V("getCodecParametersBitsPerRawSample", bare_ffmpeg_codec_parameters_get_bits_per_raw_sample)
  V("getCodecParametersFormat", bare_ffmpeg_codec_parameters_get_format)
  V("getCodecParametersSampleRate", bare_ffmpeg_codec_parameters_get_sample_rate)
  V("getCodecParametersNbChannels", bare_ffmpeg_codec_parameters_get_nb_channels)
  V("getCodecParametersCodecType", bare_ffmpeg_codec_parameters_get_codec_type)
  V("getCodecParametersChannelLayout", bare_ffmpeg_codec_parameters_get_channel_layout)

  V("initFrame", bare_ffmpeg_frame_init)
  V("destroyFrame", bare_ffmpeg_frame_destroy)
  V("getFrameWidth", bare_ffmpeg_frame_get_width)
  V("setFrameWidth", bare_ffmpeg_frame_set_width)
  V("getFrameHeight", bare_ffmpeg_frame_get_height)
  V("setFrameHeight", bare_ffmpeg_frame_set_height)
  V("getFramePixelFormat", bare_ffmpeg_frame_get_pixel_format)
  V("setFramePixelFormat", bare_ffmpeg_frame_set_pixel_format)
  V("getFrameFormat", bare_ffmpeg_frame_get_format)
  V("setFrameFormat", bare_ffmpeg_frame_set_format)
  V("getFrameChannelLayout", bare_ffmpeg_frame_get_channel_layout)
  V("setFrameChannelLayout", bare_ffmpeg_frame_set_channel_layout)
  V("getFrameNbSamples", bare_ffmpeg_frame_get_nb_samples)
  V("setFrameNbSamples", bare_ffmpeg_frame_set_nb_samples)
  V("getFramePTS", bare_ffmpeg_frame_get_pts)
  V("setFramePTS", bare_ffmpeg_frame_set_pts)
  V("getFrameTimeBase", bare_ffmpeg_frame_get_time_base)
  V("setFrameTimeBase", bare_ffmpeg_frame_set_time_base)
  V("framePTSForTimeBase", bare_ffmpeg_frame_pts_for_timebase)
  V("getFramePictType", bare_ffmpeg_frame_get_pict_type)
  V("allocFrame", bare_ffmpeg_frame_alloc)

  V("initImage", bare_ffmpeg_image_init)
  V("fillImage", bare_ffmpeg_image_fill)
  V("getImageLineSize", bare_ffmpeg_image_get_line_size)

  V("initSamples", bare_ffmpeg_samples_init)
  V("fillSamples", bare_ffmpeg_samples_fill)

  V("initPacket", bare_ffmpeg_packet_init)
  V("initPacketFromBuffer", bare_ffmpeg_packet_init_from_buffer)
  V("unrefPacket", bare_ffmpeg_packet_unref)
  V("getPacketStreamIndex", bare_ffmpeg_packet_get_stream_index)
  V("setPacketStreamIndex", bare_ffmpeg_packet_set_stream_index)
  V("getPacketDTS", bare_ffmpeg_packet_get_dts)
  V("setPacketDTS", bare_ffmpeg_packet_set_dts)
  V("getPacketPTS", bare_ffmpeg_packet_get_pts)
  V("setPacketPTS", bare_ffmpeg_packet_set_pts)
  V("getPacketTimeBase", bare_ffmpeg_packet_get_time_base)
  V("setPacketTimeBase", bare_ffmpeg_packet_set_time_base)
  V("packetPTSForTimeBase", bare_ffmpeg_packet_pts_for_timebase)
  V("packetDTSForTimeBase", bare_ffmpeg_packet_dts_for_timebase)
  V("getPacketData", bare_ffmpeg_packet_get_data)
  V("isPacketKeyframe", bare_ffmpeg_packet_is_keyframe)

  V("initScaler", bare_ffmpeg_scaler_init)
  V("destroyScaler", bare_ffmpeg_scaler_destroy)
  V("scaleScaler", bare_ffmpeg_scaler_scale)

  V("initDictionary", bare_ffmpeg_dictionary_init)
  V("destroyDictionary", bare_ffmpeg_dictionary_destroy)
  V("getDictionaryEntry", bare_ffmpeg_dictionary_get_entry)
  V("setDictionaryEntry", bare_ffmpeg_dictionary_set_entry)

  V("initResampler", bare_ffmpeg_resampler_init)
  V("destroyResampler", bare_ffmpeg_resampler_destroy)
  V("convertResampler", bare_ffmpeg_resampler_convert_frames)
  V("getResamplerDelay", bare_ffmpeg_resampler_get_delay)
  V("flushResampler", bare_ffmpeg_resampler_flush)

  V("copyChannelLayout", bare_ffmpeg_channel_layout_copy)
  V("getChannelLayoutNbChannels", bare_ffmpeg_channel_layout_get_nb_channels)
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
#undef V

#define V(name) \
  { \
    js_value_t *val; \
    err = js_create_int64(env, name, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, #name, val); \
    assert(err == 0); \
  }

  V(AV_CODEC_ID_MJPEG)
  V(AV_CODEC_ID_H264)
  V(AV_CODEC_ID_AAC)
  V(AV_CODEC_ID_OPUS)
  V(AV_CODEC_ID_AV1)

  V(AV_PIX_FMT_RGBA)
  V(AV_PIX_FMT_RGB24)
  V(AV_PIX_FMT_YUVJ420P)
  V(AV_PIX_FMT_YUV420P)

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
#undef V

  return exports;
}

BARE_MODULE(bare_ffmpeg, bare_ffmpeg_exports)
