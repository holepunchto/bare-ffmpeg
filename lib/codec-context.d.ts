import FFmpegChannelLayout from './channel-layout'
import FFmpegDictionary from './dictionary'
import FFmpegEncoder from './encoder'
import FFmpegFrame from './frame'
import FFmpegPacket from './packet'
import FFmpegRational from './rational'

declare class FFmpegCodecContext {
  pixelFormat: number
  width: number
  height: number
  sampleFormat: number
  sampleRate: number
  timeBase: FFmpegRational
  gopSize: number

  get channelLayout(): FFmpegChannelLayout
  set channelLayout(value: FFmpegChannelLayout | string | number)

  constructor(codec: FFmpegEncoder)

  open(options?: FFmpegDictionary): this

  sendPacket(packet: FFmpegPacket): boolean
  receivePacket(packet: FFmpegPacket): boolean

  sendFrame(frame: FFmpegFrame): boolean
  receiveFrame(frame: FFmpegFrame): boolean

  destroy(): void
  [Symbol.dispose](): void
}

export = FFmpegCodecContext
