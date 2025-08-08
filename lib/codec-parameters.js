const binding = require('../binding')
const ChannelLayout = require('./channel-layout')
const Rational = require('./rational')

module.exports = class FFmpegCodecParameters {
  constructor(handle) {
    this._handle = handle
  }

  get bitRate() {
    return binding.getCodecParametersBitRate(this._handle)
  }

  get bitsPerCodedSample() {
    return binding.getCodecParametersBitsPerCodedSample(this._handle)
  }

  get bitsPerRawSample() {
    return binding.getCodecParametersBitsPerRawSample(this._handle)
  }

  get sampleRate() {
    return binding.getCodecParametersSampleRate(this._handle)
  }

  get frameRate() {
    const view = new Int32Array(
      binding.getCodecParametersFramerate(this._handle)
    )
    return new Rational(view[0], view[1])
  }

  get nbChannels() {
    return binding.getCodecParametersNbChannels(this._handle)
  }

  get codecType() {
    return binding.getCodecParametersCodecType(this._handle)
  }

  set codecType(type) {
    return binding.setCodecParametersCodecType(this._handle, type)
  }

  get codecTag() {
    return binding.getCodecParametersCodecTag(this._handle)
  }

  set codecTag(tag) {
    return binding.setCodecParametersCodecTag(this._handle, tag)
  }

  get codecId() {
    return binding.getCodecParametersCodecId(this._handle)
  }

  set codecId(id) {
    return binding.setCodecParametersCodecId(this._handle, id)
  }

  get codecLevel() {
    return binding.getCodecParametersCodecLevel(this._handle)
  }

  set codecLevel(level) {
    return binding.setCodecParametersCodecLevel(this._handle, level)
  }

  get codecProfile() {
    return binding.getCodecParametersCodecProfile(this._handle)
  }

  set codecProfile(profile) {
    return binding.setCodecParametersCodecProfile(this._handle, profile)
  }

  get format() {
    return binding.getCodecParametersCodecFormat(this._handle)
  }

  set format(format) {
    return binding.setCodecParametersCodecFormat(this._handle, format)
  }

  get channelLayout() {
    return new ChannelLayout(
      binding.getCodecParametersChannelLayout(this._handle)
    )
  }

  get width() {
    return binding.getCodecParametersWidth(this._handle)
  }

  get height() {
    return binding.getCodecParametersHeight(this._handle)
  }

  get extraData() {
    return Buffer.from(binding.getCodecParametersExtraData(this._handle))
  }

  set extraData(value) {
    binding.setCodecParametersExtraData(
      this._handle,
      value.buffer,
      value.byteOffset,
      value.byteLength
    )
  }

  fromContext(context) {
    binding.codecParametersFromContext(this._handle, context._handle)
  }

  toContext(context) {
    binding.codecParametersToContext(context._handle, this._handle)
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegCodecParameters },
      codecType: this.codecType,
      codecId: this.codecId,
      width: this.width,
      height: this.height,
      bitRate: this.bitRate,
      bitsPerCodedSample: this.bitsPerCodedSample,
      bitsPerRawSample: this.bitsPerRawSample,
      format: this.format,
      sampleRate: this.sampleRate,
      nbChannels: this.nbChannels,
      channelLayout: this.channelLayout,
      frameRate: this.frameRate,
      extraData: this.extraData
    }
  }
}
