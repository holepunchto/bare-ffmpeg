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
#include <libavutil/dict.h>
#include <libavutil/error.h>
#include <libavutil/frame.h>
#include <libavutil/imgutils.h>
#include <libavutil/log.h>
#include <libavutil/mem.h>
#include <libavutil/pixfmt.h>
#include <libavutil/rational.h>
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

static js_value_t *
bare_ffmpeg_output_format_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  size_t len;
  err = js_get_value_string_utf8(env, argv[0], NULL, 0, &len);
  assert(err == 0);

  len += +1 /* NULL */;

  utf8_t *name = reinterpret_cast<utf8_t *>(malloc(len));
  err = js_get_value_string_utf8(env, argv[0], name, len, NULL);
  assert(err == 0);

  const AVOutputFormat *format = av_guess_format((const char *) name, NULL, NULL);

  if (format == NULL) {
    err = js_throw_errorf(env, NULL, "No output format found for name '%s'", name);
    assert(err == 0);

    free(name);

    return NULL;
  }

  free(name);

  js_value_t *handle;

  bare_ffmpeg_output_format_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_output_format_t), (void **) &context, &handle);
  assert(err == 0);

  context->handle = format;

  return handle;
}

static js_value_t *
bare_ffmpeg_input_format_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  size_t len;
  err = js_get_value_string_utf8(env, argv[0], NULL, 0, &len);
  assert(err == 0);

  len += +1 /* NULL */;

  utf8_t *name = reinterpret_cast<utf8_t *>(malloc(len));
  err = js_get_value_string_utf8(env, argv[0], name, len, NULL);
  assert(err == 0);

  const AVInputFormat *format = av_find_input_format((const char *) name);

  if (format == NULL) {
    err = js_throw_errorf(env, NULL, "No input format found for name '%s'", name);
    assert(err == 0);

    free(name);

    return NULL;
  }

  free(name);

  js_value_t *handle;

  bare_ffmpeg_input_format_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_input_format_t), (void **) &context, &handle);
  assert(err == 0);

  context->handle = format;

  return handle;
}

static js_value_t *
bare_ffmpeg_format_context_open_input_with_io(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_io_context_t *io;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &io, NULL);
  assert(err == 0);

  js_value_t *handle;

  bare_ffmpeg_format_context_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_format_context_t), (void **) &context, &handle);
  assert(err == 0);

  context->handle = avformat_alloc_context();

  context->handle->pb = io->handle;
  context->handle->opaque = (void *) context;

  err = avformat_open_input(&context->handle, NULL, NULL, NULL);

  if (err < 0) {
    avformat_free_context(context->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  err = avformat_find_stream_info(context->handle, NULL);

  if (err < 0) {
    avformat_close_input(&context->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  return handle;
}

static js_value_t *
bare_ffmpeg_format_context_open_input_with_format(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);
  assert(argc == 3);

  bare_ffmpeg_input_format_t *format;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &format, NULL);
  assert(err == 0);

  js_value_t *handle;

  bare_ffmpeg_format_context_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_format_context_t), (void **) &context, &handle);
  assert(err == 0);

  context->handle = avformat_alloc_context();

  context->handle->opaque = (void *) context;

  bare_ffmpeg_dictionary_t *options;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &options, NULL);
  assert(err == 0);

  size_t len;
  err = js_get_value_string_utf8(env, argv[2], NULL, 0, &len);
  assert(err == 0);

  len += +1 /* NULL */;

  utf8_t *url = reinterpret_cast<utf8_t *>(malloc(len));
  err = js_get_value_string_utf8(env, argv[2], url, len, NULL);
  assert(err == 0);

  err = avformat_open_input(&context->handle, (char *) url, format->handle, &options->handle);

  free(url);

  if (err < 0) {
    avformat_free_context(context->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  err = avformat_find_stream_info(context->handle, NULL);

  if (err < 0) {
    avformat_close_input(&context->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  return handle;
}

static js_value_t *
bare_ffmpeg_format_context_close_input(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_format_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  avformat_close_input(&context->handle);

  return NULL;
}

static js_value_t *
bare_ffmpeg_format_context_open_output(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_output_format_t *format;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &format, NULL);
  assert(err == 0);

  bare_ffmpeg_io_context_t *io;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &io, NULL);
  assert(err == 0);

  js_value_t *handle;

  bare_ffmpeg_format_context_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_format_context_t), (void **) &context, &handle);
  assert(err == 0);

  err = avformat_alloc_output_context2(&context->handle, format->handle, NULL, NULL);

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  context->handle->pb = io->handle;
  context->handle->opaque = (void *) context;

  return handle;
}

static js_value_t *
bare_ffmpeg_format_context_close_output(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_format_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  avformat_free_context(context->handle);

  return NULL;
}

static js_value_t *
bare_ffmpeg_format_context_get_streams(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_format_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  uint32_t len = context->handle->nb_streams;

  js_value_t *result;
  err = js_create_array_with_length(env, len, &result);
  assert(err == 0);

  for (uint32_t i = 0; i < len; i++) {
    js_value_t *handle;

    bare_ffmpeg_stream_t *stream;
    err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_stream_t), (void **) &stream, &handle);
    assert(err == 0);

    stream->handle = context->handle->streams[i];

    err = js_set_element(env, result, i, handle);
    assert(err == 0);
  }

  return result;
}

static js_value_t *
bare_ffmpeg_format_context_get_best_stream_index(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_format_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  int type;
  err = js_get_value_int32(env, argv[1], &type);
  assert(err == 0);

  int i = av_find_best_stream(context->handle, static_cast<AVMediaType>(type), -1, -1, NULL, 0);

  if (i < 0) i = -1;

  js_value_t *result;
  err = js_create_int32(env, i, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_format_context_create_stream(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_format_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  bare_ffmpeg_codec_t *codec;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &codec, NULL);
  assert(err == 0);

  js_value_t *handle;

  bare_ffmpeg_stream_t *stream;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_stream_t), (void **) &stream, &handle);
  assert(err == 0);

  stream->handle = avformat_new_stream(context->handle, codec->handle);

  if (stream->handle == NULL) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  return handle;
}

static js_value_t *
bare_ffmpeg_format_context_read_frame(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_format_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  bare_ffmpeg_packet_t *packet;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &packet, NULL);
  assert(err == 0);

  av_packet_unref(packet->handle);

  err = av_read_frame(context->handle, packet->handle);

  if (err < 0 && err != AVERROR(EAGAIN) && err != AVERROR_EOF) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
  }

  js_value_t *result;
  err = js_get_boolean(env, err == 0, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_stream_get_codec(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_stream_t *stream;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &stream, NULL);
  assert(err == 0);

  js_value_t *id;
  err = js_create_uint32(env, stream->handle->codecpar->codec_id, &id);
  assert(err == 0);

  return id;
}

static js_value_t *
bare_ffmpeg_stream_get_codec_parameters(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_stream_t *stream;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &stream, NULL);
  assert(err == 0);

  js_value_t *handle;

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_codec_parameters_t), (void **) &parameters, &handle);
  assert(err == 0);

  parameters->handle = stream->handle->codecpar;

  return handle;
}

static js_value_t *
bare_ffmpeg_find_decoder_by_id(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  uint32_t id;
  err = js_get_value_uint32(env, argv[0], &id);
  assert(err == 0);

  const AVCodec *decoder = avcodec_find_decoder((enum AVCodecID) id);

  if (decoder == NULL) {
    err = js_throw_errorf(env, NULL, "No decoder found for codec '%d'", id);
    assert(err == 0);

    return NULL;
  }

  js_value_t *handle;

  bare_ffmpeg_codec_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_codec_t), (void **) &context, &handle);
  assert(err == 0);

  context->handle = decoder;

  return handle;
}

static js_value_t *
bare_ffmpeg_find_encoder_by_id(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  uint32_t id;
  err = js_get_value_uint32(env, argv[0], &id);
  assert(err == 0);

  const AVCodec *encoder = avcodec_find_encoder((enum AVCodecID) id);

  if (encoder == NULL) {
    err = js_throw_errorf(env, NULL, "No encoder found for codec '%d'", id);
    assert(err == 0);

    return NULL;
  }

  js_value_t *handle;

  bare_ffmpeg_codec_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_codec_t), (void **) &context, &handle);
  assert(err == 0);

  context->handle = encoder;

  return handle;
}

static js_value_t *
bare_ffmpeg_codec_context_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_t *codec;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &codec, NULL);
  assert(err == 0);

  js_value_t *handle;

  bare_ffmpeg_codec_context_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_codec_context_t), (void **) &context, &handle);
  assert(err == 0);

  context->handle = avcodec_alloc_context3(codec->handle);

  context->handle->opaque = (void *) context;

  return handle;
}

static js_value_t *
bare_ffmpeg_codec_context_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  avcodec_free_context(&context->handle);

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_context_open(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  err = avcodec_open2(context->handle, context->handle->codec, NULL);

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_context_open_with_options(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  bare_ffmpeg_dictionary_t *options;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &options, NULL);
  assert(err == 0);

  err = avcodec_open2(context->handle, context->handle->codec, &options->handle);

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_context_get_pixel_format(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, context->handle->pix_fmt, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_codec_context_set_pixel_format(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  int64_t value;
  err = js_get_value_int64(env, argv[1], &value);
  assert(err == 0);

  context->handle->pix_fmt = static_cast<AVPixelFormat>(value);

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_context_get_width(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, context->handle->width, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_codec_context_set_width(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  int64_t value;
  err = js_get_value_int64(env, argv[1], &value);
  assert(err == 0);

  context->handle->width = value;

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_context_get_height(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, context->handle->height, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_codec_context_set_height(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  int64_t value;
  err = js_get_value_int64(env, argv[1], &value);
  assert(err == 0);

  context->handle->height = value;

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_context_get_time_base(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  js_value_t *result;

  int32_t *data;
  err = js_create_arraybuffer(env, 2 * sizeof(int32_t), (void **) &data, &result);
  assert(err == 0);

  data[0] = context->handle->time_base.num;
  data[1] = context->handle->time_base.den;

  return result;
}

static js_value_t *
bare_ffmpeg_codec_context_set_time_base(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  int32_t *value;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &value, NULL);
  assert(err == 0);

  context->handle->time_base.num = value[0];
  context->handle->time_base.den = value[1];

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_context_send_packet(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  bare_ffmpeg_packet_t *packet;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &packet, NULL);
  assert(err == 0);

  err = avcodec_send_packet(context->handle, packet->handle);

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_context_receive_packet(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  bare_ffmpeg_packet_t *packet;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &packet, NULL);
  assert(err == 0);

  err = avcodec_receive_packet(context->handle, packet->handle);

  if (err < 0 && err != AVERROR(EAGAIN) && err != AVERROR_EOF) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  js_value_t *result;
  err = js_get_boolean(env, err == 0, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_codec_context_send_frame(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &frame, NULL);
  assert(err == 0);

  err = avcodec_send_frame(context->handle, frame->handle);

  if (err == AVERROR(EAGAIN) || err == AVERROR_EOF) {
    js_value_t *result;
    err = js_get_boolean(env, false, &result);
    assert(err == 0);

    return result;
  }

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  js_value_t *result;
  err = js_get_boolean(env, err == 0, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_codec_context_receive_frame(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &frame, NULL);
  assert(err == 0);

  err = avcodec_receive_frame(context->handle, frame->handle);

  if (err < 0 && err != AVERROR(EAGAIN) && err != AVERROR_EOF) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  js_value_t *result;
  err = js_get_boolean(env, err == 0, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_codec_parameters_from_context(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &parameters, NULL);
  assert(err == 0);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &context, NULL);
  assert(err == 0);

  err = avcodec_parameters_from_context(parameters->handle, context->handle);

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_parameters_to_context(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &parameters, NULL);
  assert(err == 0);

  err = avcodec_parameters_to_context(context->handle, parameters->handle);

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_ffmpeg_codec_parameters_get_bit_rate(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &parameters, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, parameters->handle->bit_rate, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_codec_parameters_get_bits_per_coded_sample(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &parameters, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, parameters->handle->bits_per_coded_sample, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_codec_parameters_get_bits_per_raw_sample(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &parameters, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, parameters->handle->bits_per_raw_sample, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_codec_parameters_get_sample_rate(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &parameters, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int64(env, parameters->handle->sample_rate, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_frame_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  js_value_t *handle;

  bare_ffmpeg_frame_t *frame;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_frame_t), (void **) &frame, &handle);
  assert(err == 0);

  frame->handle = av_frame_alloc();

  frame->handle->opaque = (void *) frame;

  return handle;
}

static js_value_t *
bare_ffmpeg_frame_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  av_frame_free(&frame->handle);

  return NULL;
}

static js_value_t *
bare_ffmpeg_frame_get_audio_channel(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  uint32_t i;
  err = js_get_value_uint32(env, argv[1], &i);
  assert(err == 0);

  assert(i < AV_NUM_DATA_POINTERS);

  js_value_t *result;

  size_t len = frame->handle->linesize[i];

  void *data;
  err = js_create_unsafe_arraybuffer(env, len, &data, &result);
  assert(err == 0);

  memcpy(data, frame->handle->data[i], len);

  return result;
}

static js_value_t *
bare_ffmpeg_frame_get_width(js_env_t *env, js_callback_info_t *info) {
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
  err = js_create_int32(env, frame->handle->width, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_frame_set_width(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  int32_t width;
  err = js_get_value_int32(env, argv[1], &width);
  assert(err == 0);

  frame->handle->width = width;

  return NULL;
}

static js_value_t *
bare_ffmpeg_frame_get_height(js_env_t *env, js_callback_info_t *info) {
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
  err = js_create_int32(env, frame->handle->height, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_frame_set_height(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  int32_t height;
  err = js_get_value_int32(env, argv[1], &height);
  assert(err == 0);

  frame->handle->height = height;

  return NULL;
}

static js_value_t *
bare_ffmpeg_frame_get_pixel_format(js_env_t *env, js_callback_info_t *info) {
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
bare_ffmpeg_frame_set_pixel_format(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  int64_t pixel_format;
  err = js_get_value_int64(env, argv[1], &pixel_format);
  assert(err == 0);

  frame->handle->format = (enum AVPixelFormat) pixel_format;

  return NULL;
}

static js_value_t *
bare_ffmpeg_frame_alloc(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &frame, NULL);
  assert(err == 0);

  int align;
  err = js_get_value_int32(env, argv[1], &align);
  assert(err == 0);

  err = av_frame_get_buffer(frame->handle, align);

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_ffmpeg_image_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 4;
  js_value_t *argv[4];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 4);

  int64_t format;
  err = js_get_value_int64(env, argv[0], &format);
  assert(err == 0);

  int32_t width;
  err = js_get_value_int32(env, argv[1], &width);
  assert(err == 0);

  int32_t height;
  err = js_get_value_int32(env, argv[2], &height);
  assert(err == 0);

  int32_t align;
  err = js_get_value_int32(env, argv[3], &align);
  assert(err == 0);

  size_t len = av_image_get_buffer_size((enum AVPixelFormat) format, width, height, align);

  js_value_t *handle;

  uint8_t *data;
  err = js_create_arraybuffer(env, len, (void **) &data, &handle);
  assert(err == 0);

  return handle;
}

static js_value_t *
bare_ffmpeg_image_fill(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 5;
  js_value_t *argv[5];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 5);

  int64_t pixel_format;
  err = js_get_value_int64(env, argv[0], &pixel_format);
  assert(err == 0);

  int32_t width;
  err = js_get_value_int32(env, argv[1], &width);
  assert(err == 0);

  int32_t height;
  err = js_get_value_int32(env, argv[2], &height);
  assert(err == 0);

  uint8_t *data;
  err = js_get_arraybuffer_info(env, argv[3], (void **) &data, NULL);
  assert(err == 0);

  bare_ffmpeg_frame_t *frame;
  err = js_get_arraybuffer_info(env, argv[4], (void **) &frame, NULL);
  assert(err == 0);

  err = av_image_fill_arrays(frame->handle->data, frame->handle->linesize, data, (enum AVPixelFormat) pixel_format, width, height, 1);
  assert(err >= 0);

  return NULL;
}

static js_value_t *
bare_ffmpeg_image_get_line_size(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  int64_t pixel_format;
  err = js_get_value_int64(env, argv[0], &pixel_format);
  assert(err == 0);

  int32_t width;
  err = js_get_value_int32(env, argv[1], &width);
  assert(err == 0);

  int32_t plane;
  err = js_get_value_int32(env, argv[2], &plane);
  assert(err == 0);

  int32_t linesize = av_image_get_linesize((enum AVPixelFormat) pixel_format, width, plane);

  js_value_t *result;
  err = js_create_int32(env, linesize, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_packet_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  js_value_t *handle;

  bare_ffmpeg_packet_t *packet;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_packet_t), (void **) &packet, &handle);
  assert(err == 0);

  packet->handle = av_packet_alloc();

  return handle;
}

static js_value_t *
bare_ffmpeg_packet_init_from_buffer(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  uint8_t *data;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &data, NULL);
  assert(err == 0);

  uint32_t offset;
  err = js_get_value_uint32(env, argv[1], &offset);
  assert(err == 0);

  uint32_t len;
  err = js_get_value_uint32(env, argv[2], &len);
  assert(err == 0);

  AVPacket *pkt = av_packet_alloc();
  assert(pkt != NULL);

  err = av_new_packet(pkt, len);
  assert(err == 0);

  memcpy(pkt->data, &data[offset], len);

  js_value_t *handle;

  bare_ffmpeg_packet_t *packet;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_packet_t), (void **) &packet, &handle);
  assert(err == 0);

  packet->handle = pkt;

  return handle;
}

static js_value_t *
bare_ffmpeg_packet_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_packet_t *packet;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &packet, NULL);
  assert(err == 0);

  av_packet_unref(packet->handle);

  return NULL;
}

static js_value_t *
bare_ffmpeg_packet_unref(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_packet_t *packet;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &packet, NULL);
  assert(err == 0);

  av_packet_unref(packet->handle);

  return NULL;
}

static js_value_t *
bare_ffmpeg_packet_get_stream_index(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_packet_t *packet;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &packet, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_create_int32(env, packet->handle->stream_index, &result);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_ffmpeg_packet_get_data(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_packet_t *packet;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &packet, NULL);
  assert(err == 0);

  js_value_t *handle;

  uint8_t *data;
  err = js_create_arraybuffer(env, packet->handle->size, (void **) &data, &handle);
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
bare_ffmpeg_exports(js_env_t *env, js_value_t *exports) {
  uv_once(&bare_ffmpeg__init_guard, bare_ffmpeg__on_init);

  int err;

#define V(name, fn) \
  err = js_set_property<fn>(env, exports, name); \
  assert(err == 0);

  V("initIOContext", bare_ffmpeg_io_context_init)
  V("destroyIOContext", bare_ffmpeg_io_context_destroy)

#undef V

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

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
  V("allocFrame", bare_ffmpeg_frame_alloc)

  V("initImage", bare_ffmpeg_image_init)
  V("fillImage", bare_ffmpeg_image_fill)
  V("getImageLineSize", bare_ffmpeg_image_get_line_size)

  V("initPacket", bare_ffmpeg_packet_init)
  V("initPacketFromBuffer", bare_ffmpeg_packet_init_from_buffer)
  V("destroyPacket", bare_ffmpeg_packet_destroy)
  V("unrefPacket", bare_ffmpeg_packet_unref)
  V("getPacketStreamIndex", bare_ffmpeg_packet_get_stream_index)
  V("getPacketData", bare_ffmpeg_packet_get_data)

  V("initScaler", bare_ffmpeg_scaler_init)
  V("destroyScaler", bare_ffmpeg_scaler_destroy)
  V("scaleScaler", bare_ffmpeg_scaler_scale)

  V("initDictionary", bare_ffmpeg_dictionary_init)
  V("destroyDictionary", bare_ffmpeg_dictionary_destroy)
  V("getDictionaryEntry", bare_ffmpeg_dictionary_get_entry)
  V("setDictionaryEntry", bare_ffmpeg_dictionary_set_entry)
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
#undef V

  return exports;
}

BARE_MODULE(bare_ffmpeg, bare_ffmpeg_exports)
