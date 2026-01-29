const ffmpeg = require('..')
const fetch = require('bare-fetch')

const args = Bare.argv.slice(2)
let duration = 5
let deviceIndex = null
let whisperUrl = 'http://localhost:9090'

if (args[0] === '--device') {
  deviceIndex = parseInt(args[1])
  duration = parseInt(args[2]) || 5
  whisperUrl = args[3] || whisperUrl
}
whisperUrl = whisperUrl.replace(/\/$/, '')

const SAMPLE_RATE = 16000
const SEGMENT_DURATION = 10

async function main() {
  if (deviceIndex === null) {
    const format = AudioCapture.getCaptureFormat()
    console.log('Usage:')
    console.log(
      '  bare examples/live-audio-to-whisper.js --device <index> [duration] [whisper-url]'
    )
    console.log('\nList audio devices:')
    console.log(`  ffmpeg -f ${format} -list_devices true -i ""`)
    console.log('\nExample:')
    console.log('  bare examples/live-audio-to-whisper.js --device 0 15')
    return
  }

  const capture = new AudioCapture({
    device: deviceIndex,
    duration,
    sampleRate: SAMPLE_RATE
  })

  const recorder = new WhisperRecorder({
    url: whisperUrl,
    sampleRate: SAMPLE_RATE,
    segmentDuration: SEGMENT_DURATION
  })

  capture.on('data', (chunk, samples) => {
    recorder.addAudio(chunk, samples)
  })

  capture.on('end', async () => {
    try {
      const text = await recorder.finalize()
      console.log('\n─── Transcription ───')
      console.log(text)
    } catch (err) {
      console.error(err.message)
      Bare.exit(1)
    }
  })

  capture.start()
}

class AudioCapture {
  constructor({ device, duration = Infinity, sampleRate = 16000 }) {
    this.device = device
    this.duration = duration
    this.sampleRate = sampleRate
    this._listeners = new Map()
  }

  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, [])
    this._listeners.get(event).push(fn)
  }

  _emit(event, ...args) {
    const listeners = this._listeners.get(event) || []
    for (const fn of listeners) fn(...args)
  }

  static getCaptureFormat() {
    switch (Bare.platform) {
      case 'darwin':
      case 'ios':
        return 'avfoundation'
      case 'linux':
        return 'alsa'
      case 'win32':
        return 'dshow'
      default:
        throw new Error(`Unsupported platform: ${Bare.platform}`)
    }
  }

  static getCaptureUrl(idx) {
    switch (Bare.platform) {
      case 'darwin':
      case 'ios':
        return `:${idx}`
      case 'linux':
        return idx === 0 ? 'default' : `hw:${idx}`
      case 'win32':
        return `audio=Integrated Microphone`
    }
  }

  start() {
    const captureFormat = AudioCapture.getCaptureFormat()
    const captureUrl = AudioCapture.getCaptureUrl(this.device)

    console.log(`Opening ${captureFormat} (${captureUrl})...`)

    using inputContext = new ffmpeg.InputFormatContext(
      new ffmpeg.InputFormat(captureFormat),
      new ffmpeg.Dictionary(),
      captureUrl
    )

    this._decodeAndResample(inputContext)
  }

  _decodeAndResample(inputContext) {
    const stream = inputContext.getBestStream(ffmpeg.constants.mediaTypes.AUDIO)
    if (!stream) throw new Error('No audio stream found')

    const srcRate = stream.codecParameters.sampleRate
    const srcChannels = stream.codecParameters.channelLayout.nbChannels
    console.log(`Source: ${srcRate}Hz, ${srcChannels}ch`)

    using decoder = stream.decoder()
    decoder.open()

    using resampler = new ffmpeg.Resampler(
      srcRate,
      stream.codecParameters.channelLayout,
      stream.codecParameters.format,
      this.sampleRate,
      ffmpeg.constants.channelLayouts.MONO,
      ffmpeg.constants.sampleFormats.S16
    )

    let totalSamples = 0
    const targetSamples = this.duration * this.sampleRate
    const bytesPerSample = 2

    using packet = new ffmpeg.Packet()
    using raw = new ffmpeg.Frame()

    if (this.duration < Infinity) {
      console.log(`Capturing ${this.duration}s...`)
    }

    while (totalSamples < targetSamples) {
      let gotFrame = false
      const deadline = Date.now() + 2000
      while (Date.now() < deadline) {
        if (inputContext.readFrame(packet)) {
          gotFrame = true
          break
        }
      }
      if (!gotFrame) break

      if (packet.streamIndex !== stream.index) {
        packet.unref()
        continue
      }

      decoder.sendPacket(packet)
      packet.unref()

      while (decoder.receiveFrame(raw) && totalSamples < targetSamples) {
        using output = new ffmpeg.Frame()
        output.channelLayout = ffmpeg.constants.channelLayouts.MONO
        output.format = ffmpeg.constants.sampleFormats.S16
        output.nbSamples = raw.nbSamples
        output.sampleRate = this.sampleRate

        const samples = new ffmpeg.Samples()
        samples.fill(output)

        const converted = resampler.convert(raw, output)
        if (converted > 0) {
          this._emit(
            'data',
            Buffer.from(samples.data.buffer, samples.data.byteOffset, converted * bytesPerSample),
            converted
          )
          totalSamples += converted
        }
      }
    }

    using flushOut = new ffmpeg.Frame()
    flushOut.channelLayout = ffmpeg.constants.channelLayouts.MONO
    flushOut.format = ffmpeg.constants.sampleFormats.S16
    flushOut.nbSamples = 4096
    flushOut.sampleRate = this.sampleRate

    const flushSamples = new ffmpeg.Samples()
    flushSamples.fill(flushOut)

    let flushed
    while ((flushed = resampler.flush(flushOut)) > 0) {
      this._emit(
        'data',
        Buffer.from(
          flushSamples.data.buffer,
          flushSamples.data.byteOffset,
          flushed * bytesPerSample
        ),
        flushed
      )
    }

    this._emit('end')
  }
}

class WhisperRecorder {
  constructor({ url, sampleRate, segmentDuration }) {
    this.url = url
    this.sampleRate = sampleRate
    this.segmentDuration = segmentDuration
    this.segments = []
    this.current = []
    this.currentSamples = 0
  }

  addAudio(chunk, samples) {
    this.current.push(chunk)
    this.currentSamples += samples

    if (this.currentSamples >= this.segmentDuration * this.sampleRate) {
      this.segments.push({ data: Buffer.concat(this.current), samples: this.currentSamples })
      this.current = []
      this.currentSamples = 0
    }
  }

  async finalize() {
    if (this.currentSamples > 0) {
      this.segments.push({ data: Buffer.concat(this.current), samples: this.currentSamples })
    }

    const parts = []
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i]
      const wav = this._buildWav(seg.data, seg.samples)
      console.log(
        `Segment ${i + 1}/${this.segments.length}: ${(seg.samples / this.sampleRate).toFixed(2)}s, ${wav.length} bytes`
      )

      const text = await this._transcribe(wav)
      parts.push(text.trim())
    }

    return parts.join(' ')
  }

  _buildWav(pcmData, numSamples) {
    const bytesPerSample = 2
    const numChannels = 1
    const bitsPerSample = 16
    const dataSize = numSamples * bytesPerSample
    const header = Buffer.alloc(44)

    header.write('RIFF', 0)
    header.writeUInt32LE(36 + dataSize, 4)
    header.write('WAVE', 8)

    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16)
    header.writeUInt16LE(1, 20)
    header.writeUInt16LE(numChannels, 22)
    header.writeUInt32LE(this.sampleRate, 24)
    header.writeUInt32LE(this.sampleRate * bytesPerSample, 28)
    header.writeUInt16LE(bytesPerSample, 32)
    header.writeUInt16LE(bitsPerSample, 34)

    header.write('data', 36)
    header.writeUInt32LE(dataSize, 40)

    return Buffer.concat([header, pcmData.subarray(0, dataSize)])
  }

  async _transcribe(wavData) {
    console.log(`Sending to ${this.url}/inference ...`)

    const boundary = `----Boundary${Date.now()}${Math.random().toString(36).slice(2)}`
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
          'Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n' +
          'Content-Type: audio/wav\r\n' +
          '\r\n'
      ),
      wavData,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ])

    const res = await fetch(`${this.url}/inference`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body
    })

    if (!res.ok) {
      throw new Error(`Whisper ${res.status}: ${await res.text()}`)
    }

    const json = await res.json()
    return json.text
  }
}

main().catch((err) => {
  console.error(err.message)
  Bare.exit(1)
})
