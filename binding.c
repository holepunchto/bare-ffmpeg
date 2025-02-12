#include <assert.h>
#include <bare.h>
#include <js.h>
#include <libavcodec/avcodec.h>
#include <libavcodec/codec.h>
#include <libavcodec/codec_id.h>
#include <libavcodec/codec_par.h>
#include <libavcodec/packet.h>
#include <libavformat/avformat.h>
#include <libavformat/avio.h>
#include <libavutil/error.h>
#include <libavutil/frame.h>
#include <libavutil/imgutils.h>
#include <libavutil/log.h>
#include <libavutil/mem.h>
#include <libavutil/pixfmt.h>
#include <libswscale/swscale.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

typedef struct {
  AVIOContext *handle;
} bare_ffmpeg_io_context_t;

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
  AVPacket handle;
} bare_ffmpeg_packet_t;

typedef struct {
  struct SwsContext *handle;
} bare_ffmpeg_scaler_t;

static uv_once_t bare_ffmpeg__init_guard = UV_ONCE_INIT;

static void
bare_ffmpeg__on_init(void) {
  av_log_set_level(AV_LOG_ERROR);
}

static js_value_t *
bare_ffmpeg_io_context_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  void *data;
  size_t len;
  err = js_get_typedarray_info(env, argv[0], NULL, &data, &len, NULL, NULL);
  assert(err == 0);

  js_value_t *handle;

  bare_ffmpeg_io_context_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_io_context_t), (void **) &context, &handle);
  assert(err == 0);

  uint8_t *io;

  if (len == 0) io = NULL;
  else {
    io = av_malloc(len);

    memcpy(io, data, len);
  }

  context->handle = avio_alloc_context(io, len, 0, NULL, NULL, NULL, NULL);

  context->handle->opaque = (void *) context;

  return handle;
}

static js_value_t *
bare_ffmpeg_io_context_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_ffmpeg_io_context_t *context;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &context, NULL);
  assert(err == 0);

  av_free(context->handle->buffer);

  avio_context_free(&context->handle);

  return NULL;
}

static js_value_t *
bare_ffmpeg_format_context_init(js_env_t *env, js_callback_info_t *info) {
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
bare_ffmpeg_format_context_destroy(js_env_t *env, js_callback_info_t *info) {
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

  av_packet_unref(&packet->handle);

  err = av_read_frame(context->handle, &packet->handle);

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

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_ffmpeg_codec_t *codec;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &codec, NULL);
  assert(err == 0);

  bare_ffmpeg_codec_parameters_t *parameters;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &parameters, NULL);
  assert(err == 0);

  js_value_t *handle;

  bare_ffmpeg_codec_context_t *context;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_codec_context_t), (void **) &context, &handle);
  assert(err == 0);

  context->handle = avcodec_alloc_context3(codec->handle);

  context->handle->opaque = (void *) context;

  err = avcodec_parameters_to_context(context->handle, parameters->handle);

  if (err < 0) {
    avcodec_free_context(&context->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

  err = avcodec_open2(context->handle, codec->handle, NULL);

  if (err < 0) {
    avcodec_free_context(&context->handle);

    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);

    return NULL;
  }

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

  err = avcodec_send_packet(context->handle, &packet->handle);

  if (err < 0) {
    err = js_throw_error(env, NULL, av_err2str(err));
    assert(err == 0);
  }

  return NULL;
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
  }

  js_value_t *result;
  err = js_get_boolean(env, err == 0, &result);
  assert(err == 0);

  return result;
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
bare_ffmpeg_frame_get_channel(js_env_t *env, js_callback_info_t *info) {
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
bare_ffmpeg_packet_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  js_value_t *handle;

  bare_ffmpeg_packet_t *packet;
  err = js_create_arraybuffer(env, sizeof(bare_ffmpeg_packet_t), (void **) &packet, &handle);
  assert(err == 0);

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

  av_packet_unref(&packet->handle);

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

  av_packet_unref(&packet->handle);

  return NULL;
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
bare_ffmpeg_exports(js_env_t *env, js_value_t *exports) {
  uv_once(&bare_ffmpeg__init_guard, bare_ffmpeg__on_init);

  int err;

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("initIOContext", bare_ffmpeg_io_context_init)
  V("destroyIOContext", bare_ffmpeg_io_context_destroy)

  V("initFormatContext", bare_ffmpeg_format_context_init)
  V("destroyFormatContext", bare_ffmpeg_format_context_destroy)
  V("getFormatContextStreams", bare_ffmpeg_format_context_get_streams)
  V("readFormatContextFrame", bare_ffmpeg_format_context_read_frame)

  V("getStreamCodec", bare_ffmpeg_stream_get_codec)
  V("getStreamCodecParameters", bare_ffmpeg_stream_get_codec_parameters)

  V("findDecoderByID", bare_ffmpeg_find_decoder_by_id)
  V("findEncoderByID", bare_ffmpeg_find_encoder_by_id)

  V("initCodecContext", bare_ffmpeg_codec_context_init)
  V("destroyCodecContext", bare_ffmpeg_codec_context_destroy)
  V("getCodecContextPixelFormat", bare_ffmpeg_codec_context_get_pixel_format)
  V("getCodecContextWidth", bare_ffmpeg_codec_context_get_width)
  V("getCodecContextHeight", bare_ffmpeg_codec_context_get_height)
  V("sendCodecContextPacket", bare_ffmpeg_codec_context_send_packet)
  V("receiveCodecContextFrame", bare_ffmpeg_codec_context_receive_frame)

  V("getCodecParametersBitRate", bare_ffmpeg_codec_parameters_get_bit_rate)
  V("getCodecParametersBitsPerCodedSample", bare_ffmpeg_codec_parameters_get_bits_per_coded_sample)
  V("getCodecParametersBitsPerRawSample", bare_ffmpeg_codec_parameters_get_bits_per_raw_sample)
  V("getCodecParametersSampleRate", bare_ffmpeg_codec_parameters_get_sample_rate)

  V("initFrame", bare_ffmpeg_frame_init)
  V("destroyFrame", bare_ffmpeg_frame_destroy)
  V("getFrameChannel", bare_ffmpeg_frame_get_channel)

  V("initImage", bare_ffmpeg_image_init)
  V("fillImage", bare_ffmpeg_image_fill)

  V("initPacket", bare_ffmpeg_packet_init)
  V("destroyPacket", bare_ffmpeg_packet_destroy)
  V("unrefPacket", bare_ffmpeg_packet_unref)

  V("initScaler", bare_ffmpeg_scaler_init)
  V("destroyScaler", bare_ffmpeg_scaler_destroy)
  V("scaleScaler", bare_ffmpeg_scaler_scale)
#undef V

#define V(name) \
  { \
    js_value_t *val; \
    err = js_create_int64(env, name, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, #name, val); \
    assert(err == 0); \
  }

  V(AV_PIX_FMT_RGBA)
#undef V

  return exports;
}

BARE_MODULE(bare_ffmpeg, bare_ffmpeg_exports)
