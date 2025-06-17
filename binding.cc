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
#include <libavutil/channel_layout.h>
#include <libavutil/dict.h>
#include <libavutil/error.h>
#include <libavutil/frame.h>
#include <libavutil/imgutils.h>
#include <libavutil/log.h>
#include <libavutil/mem.h>
#include <libavutil/pixfmt.h>
#include <libavutil/rational.h>
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

static uv_once_t bare_ffmpeg__init_guard = UV_ONCE_INIT;

static void
bare_ffmpeg__on_init(void) {
  av_log_set_level(AV_LOG_ERROR);
  avdevice_register_all();
}

static js_arraybuffer_t
bare_ffmpeg_io_context_init(js_env_t *env, js_receiver_t, js_arraybuffer_span_t data, int64_t offset, int64_t len) {
  int err;

  js_arraybuffer_t handle;

  bare_ffmpeg_io_context_t *context;
  err = js_create_arraybuffer(env, context, handle);
  assert(err == 0);

  uint8_t *io;

  if (len == 0) io = NULL;
  else {
    io = reinterpret_cast<uint8_t *>(av_malloc(len));

    memcpy(io, &data[offset], len);
  }

  context->handle = avio_alloc_context(io, len, 0, NULL, NULL, NULL, NULL);

  context->handle->opaque = (void *) context;

  return handle;
}

static void
bare_ffmpeg_io_context_destroy(js_env_t *env, js_receiver_t, js_arraybuffer_span_of_t<bare_ffmpeg_io_context_t, 1> context) {
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
  int best_stream = av_find_best_stream(context->handle, static_cast<AVMediaType>(type), -1, -1, NULL, 0);

  if (best_stream < 0) best_stream = -1;

  return best_stream;
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

  if (stream->handle == NULL) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }

  return handle;
}

static bool
bare_ffmpeg_format_context_read_frame(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_format_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  av_packet_unref(packet->handle);

  int err = av_read_frame(context->handle, packet->handle);
  if (err < 0 && err != AVERROR(EAGAIN) && err != AVERROR_EOF) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
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
  }

  return NULL;
}

static js_value_t *
bare_ffmpeg_frame_get_format(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, frame->handle->format, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_frame_set_format(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  int64_t format;
  err = js_get_value_int64(env, argv[1], &format);
  assert(err == 0);

  frame->handle->format = format;

  return NULL;
}

static js_value_t *
bare_ffmpeg_frame_get_channel_layout(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  uint64_t mask = frame->handle->ch_layout.u.mask;

  js_value_t *result;
  err = js_create_int64(env, mask, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_frame_set_channel_layout(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  int64_t channel_layout;
  err = js_get_value_int64(env, argv[1], &channel_layout);
  assert(err == 0);

  av_channel_layout_from_mask(&frame->handle->ch_layout, channel_layout);

  return NULL;
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

static js_value_t *
bare_ffmpeg_frame_get_nb_samples(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);
  assert(argc == 1);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int32(env, frame->handle->nb_samples, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_frame_set_nb_samples(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);
  assert(argc == 2);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  int32_t nb_samples;
  err = js_get_value_int32(env, argv[1], &nb_samples);
  assert(err == 0);

  frame->handle->nb_samples = nb_samples;

  return NULL;
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
  int64_t value
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
  int64_t value
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
  int64_t value
) {
  context->handle->height = value;
}

static js_arraybuffer_t
bare_ffmpeg_codec_context_get_time_base(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context
) {
  js_arraybuffer_t result;
  int32_t *data;

  int err = js_create_arraybuffer(env, data, result);
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
  int64_t num,
  int64_t den
) {
  context->handle->time_base.num = num;
  context->handle->time_base.den = den;
}

static void
bare_ffmpeg_codec_context_send_packet(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_context_t, 1> context,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int err;

  err = avcodec_send_packet(context->handle, packet->handle);
  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    throw js_pending_exception;
  }
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
  if (err == AVERROR(EAGAIN) || err == AVERROR_EOF) {
    return false;
  }

  if (err < 0) {
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

static int64_t
bare_ffmpeg_codec_parameters_get_sample_rate(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_codec_parameters_t, 1> parameters
) {
  return parameters->handle->sample_rate;
}

static js_arraybuffer_t
bare_ffmpeg_frame_init(js_env_t *env, js_receiver_t) {
  js_arraybuffer_t handle;

  bare_ffmpeg_frame_t *frame;
  int err = js_create_arraybuffer(env, frame, handle);
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

static js_arraybuffer_t
bare_ffmpeg_frame_get_audio_channel(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame,
  int32_t i
) {
  int err;

  assert(i < AV_NUM_DATA_POINTERS);

  size_t len = frame->handle->linesize[i];

  int8_t *data;
  js_arraybuffer_t result;
  err = js_create_arraybuffer(env, len, data, result);
  assert(err == 0);

  memcpy(data, frame->handle->data[i], len);

  return result;
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
  int64_t format
) {
  frame->handle->format = static_cast<AVPixelFormat>(format);
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
  int64_t format,
  int32_t width,
  int32_t height,
  int32_t align
) {
  size_t len = av_image_get_buffer_size((enum AVPixelFormat) format, width, height, align);

  js_arraybuffer_t handle;
  uint8_t *data;
  int err = js_create_arraybuffer(env, len, data, handle);
  assert(err == 0);

  return handle;
}

static void
bare_ffmpeg_image_fill(
  js_env_t *env,
  js_receiver_t,
  int64_t pixel_format,
  int32_t width,
  int32_t height,
  js_arraybuffer_span_t data,
  int64_t offset,
  js_arraybuffer_span_of_t<bare_ffmpeg_frame_t, 1> frame
) {
  int err = av_image_fill_arrays(
    frame->handle->data,
    frame->handle->linesize,
    &data[offset],
    static_cast<AVPixelFormat>(pixel_format),
    width,
    height,
    1
  );
  assert(err >= 0);
}

static int
bare_ffmpeg_image_get_line_size(
  js_env_t *env,
  js_receiver_t,
  int64_t pixel_format,
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
  int64_t offset,
  int64_t len
) {
  int err;

  AVPacket *pkt = av_packet_alloc();
  assert(pkt != NULL);

  err = av_new_packet(pkt, len);
  assert(err == 0);

  memcpy(pkt->data, &data[offset], len);

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

static js_arraybuffer_t
bare_ffmpeg_packet_get_data(
  js_env_t *env,
  js_receiver_t,
  js_arraybuffer_span_of_t<bare_ffmpeg_packet_t, 1> packet
) {
  int err;

  js_arraybuffer_t handle;
  uint8_t *data;
  err = js_create_arraybuffer(env, packet->handle->size, data, handle);
  assert(err == 0);

  memcpy(data, packet->handle->data, packet->handle->size);

  return handle;
}

static js_value_t *
bare_ffmpeg_scaler_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 6;
  js_value_t *argv[6];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 6);

  int64_t source_format;
  err = js_get_value_int64(env, argv[0], &source_format);
  assert(err == 0);

  int32_t source_width;
  err = js_get_value_int32(env, argv[1], &source_width);
  assert(err == 0);

  int32_t source_height;
  err = js_get_value_int32(env, argv[2], &source_height);
  assert(err == 0);

  int64_t target_format;
  err = js_get_value_int64(env, argv[3], &target_format);
  assert(err == 0);

  int32_t target_width;
  err = js_get_value_int32(env, argv[4], &target_width);
  assert(err == 0);

  int32_t target_height;
  err = js_get_value_int32(env, argv[5], &target_height);
  assert(err == 0);

  js_value_t *handle;

  bare_ffmpeg_scaler_t *scaler;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_scaler_t), (void **) &scaler, &handle);
  assert(err == 0);

  scaler->handle = sws_getContext(
    source_width,
    source_height,
    (enum AVPixelFormat) source_format,
    target_width,
    target_height,
    (enum AVPixelFormat) target_format,
    SWS_BICUBIC,
    NULL,
    NULL,
    NULL
  );

  return handle;
}

static js_value_t *
bare_ffmpeg_scaler_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_scaler_t *scaler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &scaler, NULL);
  assert(err == 0);

  sws_freeContext(scaler->handle);

  return NULL;
}

static js_value_t *
bare_ffmpeg_scaler_scale(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 5;
  js_value_t *argv[5];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 5);

  bare_ffmpeg_scaler_t *scaler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &scaler, NULL);
  assert(err == 0);

  bare_ffmpeg_frame_t *source;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &source, NULL);
  assert(err == 0);

  int64_t y;
  err = js_get_value_int64(env, argv[2], &y);
  assert(err == 0);

  int64_t height;
  err = js_get_value_int64(env, argv[3], &height);
  assert(err == 0);

  bare_ffmpeg_frame_t *target;
  err = js_get_arraybuffer_info(env, argv[4], (void **) &target, NULL);
  assert(err == 0);

  height = sws_scale(
    scaler->handle,
    (const uint8_t *const *) source->handle->data,
    source->handle->linesize,
    y,
    height,
    target->handle->data,
    target->handle->linesize
  );

  js_value_t *result;
  err = js_create_int64(env, height, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_dictionary_init(js_env_t *env, js_callback_info_t *info) {
  int err;
  js_value_t *handle;

  bare_ffmpeg_dictionary_t *dict;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_dictionary_t), (void **) &dict, &handle);
  assert(err == 0);

  dict->handle = NULL;

  return handle;
}

static js_value_t *
bare_ffmpeg_dictionary_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_dictionary_t *dict;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &dict, NULL);
  assert(err == 0);

  av_dict_free(&dict->handle);

  return NULL;
}

static js_value_t *
bare_ffmpeg_dictionary_set_entry(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_ffmpeg_dictionary_t *dict;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &dict, NULL);
  assert(err == 0);

  size_t len;
  err = js_get_value_string_utf8(env, argv[1], NULL, 0, &len);
  assert(err == 0);

  len += +1 /* NULL */;

  utf8_t *key = reinterpret_cast<utf8_t *>(malloc(len));
  err = js_get_value_string_utf8(env, argv[1], key, len, NULL);
  assert(err == 0);

  err = js_get_value_string_utf8(env, argv[2], NULL, 0, &len);
  assert(err == 0);

  len += +1 /* NULL */;

  utf8_t *value = reinterpret_cast<utf8_t *>(malloc(len));
  err = js_get_value_string_utf8(env, argv[2], value, len, NULL);
  assert(err == 0);

  err = av_dict_set(&dict->handle, (const char *) key, (const char *) value, 0);
  assert(err == 0);

  free(key);
  free(value);

  return NULL;
}

static js_value_t *
bare_ffmpeg_dictionary_get_entry(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_dictionary_t *dict;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &dict, NULL);
  assert(err == 0);

  size_t len;
  err = js_get_value_string_utf8(env, argv[1], NULL, 0, &len);
  assert(err == 0);

  len += +1 /* NULL */;

  utf8_t *key = reinterpret_cast<utf8_t *>(malloc(len));
  err = js_get_value_string_utf8(env, argv[1], key, len, NULL);
  assert(err == 0);

  AVDictionaryEntry *entry = av_dict_get(dict->handle, (const char *) key, NULL, 0);

  free(key);

  if (entry == NULL) {
    js_value_t *result;
    err = js_get_null(env, &result);
    assert(err == 0);

    return result;
  }

  js_value_t *result;
  err = js_create_string_utf8(env, (const utf8_t *) entry->value, -1, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_resampler_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 6;
  js_value_t *argv[6];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);
  assert(argc == 6);

  int32_t in_rate, out_rate;
  int64_t in_fmt, out_fmt, in_layout, out_layout;

  err = js_get_value_int32(env, argv[0], &in_rate);
  assert(err == 0);
  err = js_get_value_int64(env, argv[1], &in_fmt);
  assert(err == 0);
  err = js_get_value_int64(env, argv[2], &in_layout);
  assert(err == 0);
  err = js_get_value_int32(env, argv[3], &out_rate);
  assert(err == 0);
  err = js_get_value_int64(env, argv[4], &out_fmt);
  assert(err == 0);
  err = js_get_value_int64(env, argv[5], &out_layout);
  assert(err == 0);

  js_value_t *handle;
  bare_ffmpeg_resampler_t *resampler;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_resampler_t), (void **) &resampler, &handle);
  assert(err == 0);

  resampler->handle = swr_alloc();
  if (!resampler->handle) {
    err = js_throw_error(env, NULL, "Failed to allocate resampler");
    assert(err == 0);
    return NULL;
  }

  AVChannelLayout in_ch_layout = {};
  AVChannelLayout out_ch_layout = {};
  av_channel_layout_from_mask(&in_ch_layout, in_layout);
  av_channel_layout_from_mask(&out_ch_layout, out_layout);

  err = swr_alloc_set_opts2(&resampler->handle,
    &out_ch_layout, (enum AVSampleFormat) out_fmt, out_rate,
    &in_ch_layout, (enum AVSampleFormat) in_fmt, in_rate,
    0, NULL
  );

  if (err < 0) {
    swr_free(&resampler->handle);
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
    return NULL;
  }

  err = swr_init(resampler->handle);
  if (err < 0) {
    swr_free(&resampler->handle);
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
    return NULL;
  }

  return handle;
}

static js_value_t *
bare_ffmpeg_resampler_convert_frames(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);
  assert(argc == 3);

  bare_ffmpeg_resampler_t *resampler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &resampler, NULL);
  assert(err == 0);

  bare_ffmpeg_frame_t *in_frame;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &in_frame, NULL);
  assert(err == 0);

  bare_ffmpeg_frame_t *out_frame;
  err = js_get_arraybuffer_info(env, argv[2], (void **) &out_frame, NULL);
  assert(err == 0);

  int ret = swr_convert(
    resampler->handle,
    out_frame->handle->data, out_frame->handle->nb_samples,
    (const uint8_t **)in_frame->handle->data, in_frame->handle->nb_samples
  );

  if (ret < 0) {
    err = js_throw_error(env, NULL, av_err2str(ret));
    assert(err == 0);
    return NULL;
  }

  out_frame->handle->nb_samples = ret;

  js_value_t *result;
  err = js_create_int32(env, ret, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_resampler_get_delay(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);
  assert(argc == 2);

  bare_ffmpeg_resampler_t *resampler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &resampler, NULL);
  assert(err == 0);

  int64_t base;
  err = js_get_value_int64(env, argv[1], &base);
  assert(err == 0);

  int64_t delay = swr_get_delay(resampler->handle, base);

  js_value_t *result;
  err = js_create_int64(env, delay, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_resampler_flush(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);
  assert(argc == 2);

  bare_ffmpeg_resampler_t *resampler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &resampler, NULL);
  assert(err == 0);

  bare_ffmpeg_frame_t *out_frame;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &out_frame, NULL);
  assert(err == 0);

  int ret = swr_convert(
    resampler->handle,
    out_frame->handle->data, out_frame->handle->nb_samples,
    NULL, 0
  );

  if (ret < 0) {
    err = js_throw_error(env, NULL, av_err2str(ret));
    assert(err == 0);
    return NULL;
  }

  out_frame->handle->nb_samples = ret;

  js_value_t *result;
  err = js_create_int32(env, ret, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_resampler_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);
  assert(argc == 1);

  bare_ffmpeg_resampler_t *resampler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &resampler, NULL);
  assert(err == 0);

  swr_free(&resampler->handle);

  return NULL;
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
  V("getCodecContextTimeBase", bare_ffmpeg_codec_context_get_time_base)
  V("setCodecContextTimeBase", bare_ffmpeg_codec_context_set_time_base)
  V("sendCodecContextPacket", bare_ffmpeg_codec_context_send_packet)
  V("receiveCodecContextPacket", bare_ffmpeg_codec_context_receive_packet)
  V("sendCodecContextFrame", bare_ffmpeg_codec_context_send_frame)
  V("receiveCodecContextFrame", bare_ffmpeg_codec_context_receive_frame)

  V("codecParametersFromContext", bare_ffmpeg_codec_parameters_from_context)
  V("codecParametersToContext", bare_ffmpeg_codec_parameters_to_context)
  V("getCodecParametersBitRate", bare_ffmpeg_codec_parameters_get_bit_rate)
  V("getCodecParametersBitsPerCodedSample", bare_ffmpeg_codec_parameters_get_bits_per_coded_sample)
  V("getCodecParametersBitsPerRawSample", bare_ffmpeg_codec_parameters_get_bits_per_raw_sample)
  V("getCodecParametersSampleRate", bare_ffmpeg_codec_parameters_get_sample_rate)

  V("initFrame", bare_ffmpeg_frame_init)
  V("destroyFrame", bare_ffmpeg_frame_destroy)
  V("getFrameAudioChannel", bare_ffmpeg_frame_get_audio_channel)
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
  V("allocFrame", bare_ffmpeg_frame_alloc)
  V("getFrameNbSamples", bare_ffmpeg_frame_get_nb_samples)
  V("setFrameNbSamples", bare_ffmpeg_frame_set_nb_samples)

  V("initImage", bare_ffmpeg_image_init)
  V("fillImage", bare_ffmpeg_image_fill)
  V("getImageLineSize", bare_ffmpeg_image_get_line_size)

  V("initPacket", bare_ffmpeg_packet_init)
  V("initPacketFromBuffer", bare_ffmpeg_packet_init_from_buffer)
  V("unrefPacket", bare_ffmpeg_packet_unref)
  V("getPacketStreamIndex", bare_ffmpeg_packet_get_stream_index)
  V("getPacketData", bare_ffmpeg_packet_get_data)
#undef V

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("initScaler", bare_ffmpeg_scaler_init)
  V("destroyScaler", bare_ffmpeg_scaler_destroy)
  V("scaleScaler", bare_ffmpeg_scaler_scale)

  V("initDictionary", bare_ffmpeg_dictionary_init)
  V("destroyDictionary", bare_ffmpeg_dictionary_destroy)
  V("getDictionaryEntry", bare_ffmpeg_dictionary_get_entry)
  V("setDictionaryEntry", bare_ffmpeg_dictionary_set_entry)

  V("initResampler", bare_ffmpeg_resampler_init)
  V("destroyResampler", bare_ffmpeg_resampler_destroy)
  V("resampleResampler", bare_ffmpeg_resampler_convert_frames)
  V("getResamplerDelay", bare_ffmpeg_resampler_get_delay)
  V("flushResampler", bare_ffmpeg_resampler_flush)
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
#undef V

  return exports;
}

BARE_MODULE(bare_ffmpeg, bare_ffmpeg_exports)
