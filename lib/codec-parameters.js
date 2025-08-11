const binding = require('../binding')
const ChannelLayout = require('./channel-layout')
const Rational = require('./rational')

module.exports = class FFmpegCodecParameters {
  constructor(handle) {
    this._handle = handle
  }

  // Getters, Setters

  get bitRate() {
    return binding.getCodecParametersBitRate(this._handle)
  }

  set bitRate(rate) {
    binding.setCodecParametersBitRate(this._handle, rate)
  }

  get bitsPerCodedSample() {
    return binding.getCodecParametersBitsPerCodedSample(this._handle)
  }

  set bitsPerCodedSample(bits) {
    binding.setCodecParametersBitsPerCodedSample(this._handle, bits)
  }

  get bitsPerRawSample() {
    return binding.getCodecParametersBitsPerRawSample(this._handle)
  }

  set bitsPerRawSample(bits) {
    binding.setCodecParametersBitsPerRawSample(this._handle, bits)
  }

  get sampleRate() {
    return binding.getCodecParametersSampleRate(this._handle)
  }

  set sampleRate(rate) {
    binding.setCodecParametersSampleRate(this._handle, rate)
  }

  get sampleAspectRatio() {
    const view = new Int32Array(
      binding.getCodecParametersSampleAspectRatio(this._handle)
    )
    return new Rational(view[0], view[1])
  }

  set sampleAspectRatio(ratio) {
    binding.setCodecParametersSampleAspectRatio(
      this._handle,
      ratio.numerator,
      ratio.denominator
    )
  }

  get frameRate() {
    const view = new Int32Array(
      binding.getCodecParametersFramerate(this._handle)
    )
    return new Rational(view[0], view[1])
  }

  set frameRate(rate) {
    binding.setCodecParametersFramerate(
      this._handle,
      rate.numerator,
      rate.denominator
    )
  }

  get videoDelay() {
    return binding.getCodecParametersVideoDelay(this._handle)
  }

  set videoDelay(delay) {
    binding.setCodecParametersVideoDelay(this._handle, delay)
  }

  get nbChannels() {
    return binding.getCodecParametersNbChannels(this._handle)
  }

  set nbChannels(numberOfChannels) {
    binding.setCodecParametersNbChannels(this._handle, numberOfChannels)
  }

  get type() {
    return binding.getCodecParametersType(this._handle)
  }

  set type(type) {
    binding.setCodecParametersType(this._handle, type)
  }

  get tag() {
    return binding.getCodecParametersTag(this._handle)
  }

  set tag(tag) {
    binding.setCodecParametersTag(this._handle, tag)
  }

  get id() {
    return binding.getCodecParametersId(this._handle)
  }

  set id(id) {
    binding.setCodecParametersId(this._handle, id)
  }

  get level() {
    return binding.getCodecParametersLevel(this._handle)
  }

  set level(level) {
    binding.setCodecParametersLevel(this._handle, level)
  }

  get profile() {
    return binding.getCodecParametersProfile(this._handle)
  }

  set profile(profile) {
    binding.setCodecParametersProfile(this._handle, profile)
  }

  get format() {
    return binding.getCodecParametersFormat(this._handle)
  }

  set format(format) {
    binding.setCodecParametersFormat(this._handle, format)
  }

  get channelLayout() {
    return new ChannelLayout(
      binding.getCodecParametersChannelLayout(this._handle)
    )
  }

  set channelLayout(value) {
    binding.setCodecParametersChannelLayout(
      this._handle,
      ChannelLayout.from(value)._handle
    )
  }

  get width() {
    return binding.getCodecParametersWidth(this._handle)
  }

  set width(value) {
    binding.setCodecParametersWidth(this._handle, value)
  }

  get height() {
    return binding.getCodecParametersHeight(this._handle)
  }

  set height(value) {
    binding.setCodecParametersHeight(this._handle, value)
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

  get blockAlign() {
    return binding.getCodecParametersBlockAlign(this._handle)
  }

  set blockAlign(value) {
    binding.setCodecParametersBlockAlign(this._handle, value)
  }

  get initialPadding() {
    return binding.getCodecParametersInitialPadding(this._handle)
  }

  set initialPadding(value) {
    binding.setCodecParametersInitialPadding(this._handle, value)
  }

  get trailingPadding() {
    return binding.getCodecParametersTrailingPadding(this._handle)
  }

  set trailingPadding(value) {
    binding.setCodecParametersTrailingPadding(this._handle, value)
  }

  get seekPreroll() {
    return binding.getCodecParametersSeekPreroll(this._handle)
  }

  set seekPreroll(value) {
    binding.setCodecParametersSeekPreroll(this._handle, value)
  }

  // Methods

  fromContext(context) {
    binding.codecParametersFromContext(this._handle, context._handle)
  }

  toContext(context) {
    binding.codecParametersToContext(context._handle, this._handle)
  }

  // TODO: add other props
  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: FFmpegCodecParameters },
      type: this.type,
      id: this.id,
      format: this.format,
      profile: this.profile,
      level: this.level,
      width: this.width,
      height: this.height,
      bitRate: this.bitRate,
      bitsPerCodedSample: this.bitsPerCodedSample,
      bitsPerRawSample: this.bitsPerRawSample,
      sampleRate: this.sampleRate,
      nbChannels: this.nbChannels,
      channelLayout: this.channelLayout,
      frameRate: this.frameRate,
      extraData: this.extraData,
      blockAlign: this.blockAlign,
      initialPadding: this.initialPadding,
      trailingPadding: this.trailingPadding,
      seekPreroll: this.seekPreroll
    }
  }
}
