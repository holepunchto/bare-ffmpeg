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

  set bitRate(rate) {
    return binding.setCodecParametersBitRate(this._handle, rate)
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

  get type() {
    return binding.getCodecParametersType(this._handle)
  }

  set type(type) {
    return binding.setCodecParametersType(this._handle, type)
  }

  get tag() {
    return binding.getCodecParametersTag(this._handle)
  }

  set tag(tag) {
    return binding.setCodecParametersTag(this._handle, tag)
  }

  get id() {
    return binding.getCodecParametersId(this._handle)
  }

  set id(id) {
    return binding.setCodecParametersId(this._handle, id)
  }

  get level() {
    return binding.getCodecParametersLevel(this._handle)
  }

  set level(level) {
    return binding.setCodecParametersLevel(this._handle, level)
  }

  get profile() {
    return binding.getCodecParametersProfile(this._handle)
  }

  set profile(profile) {
    return binding.setCodecParametersProfile(this._handle, profile)
  }

  get format() {
    return binding.getCodecParametersFormat(this._handle)
  }

  set format(format) {
    return binding.setCodecParametersFormat(this._handle, format)
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
      extraData: this.extraData
    }
  }
}
