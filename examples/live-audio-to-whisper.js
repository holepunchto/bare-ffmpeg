const ffmpeg = require('..')
const fetch = require('bare-fetch')
const fs = require('bare-fs')

// ─────────────────────────────────────────────────────────────────
// Usage
//
//   bare examples/live-audio-to-whisper.js                          # list devices
//   bare examples/live-audio-to-whisper.js --device N [dur] [url]   # capture on device N
//   bare examples/live-audio-to-whisper.js --file <path> [url]      # transcribe a file
//
// Prerequisites:
//   Build and start whisper.cpp server:
//     git clone https://github.com/ggerganov/whisper.cpp
//     cd whisper.cpp && cmake -B build && cmake --build build
//     ./models/download-ggml-model.sh tiny
//     ./build/bin/whisper-server --model models/ggml-tiny.bin --port 9090
//
//   Microphone permission required on macOS:
//     System Settings → Privacy & Security → Microphone → allow Terminal
//
// ─────────────────────────────────────────────────────────────────

const args = Bare.argv.slice(2)
let duration = 5
let inputFile = null
let deviceIndex = null
let whisperUrl = 'http://localhost:8080'

if (args[0] === '--file') {
  inputFile = args[1]
  whisperUrl = args[2] || whisperUrl
} else if (args[0] === '--device') {
  deviceIndex = parseInt(args[1])
  duration = parseInt(args[2]) || 5
  whisperUrl = args[3] || whisperUrl
}
whisperUrl = whisperUrl.replace(/\/$/, '')

// Whisper expects 16kHz mono PCM
const SAMPLE_RATE = 16000
const NUM_CHANNELS = 1
const BITS_PER_SAMPLE = 16
const BYTES_PER_SAMPLE = NUM_CHANNELS * (BITS_PER_SAMPLE / 8)

// ─────────────────────────────────────────────────────────────────

async function main() {
  // No action specified → list available audio devices
  if (!inputFile && deviceIndex === null) {
    listAudioDevices()
    return
  }

  const pcmChunks = inputFile ? await decodeFile(inputFile) : await captureAudio(duration)

  const totalSamples = pcmChunks.reduce((sum, buf) => sum + buf.length / BYTES_PER_SAMPLE, 0)
  console.log(`Audio: ${totalSamples} samples (${(totalSamples / SAMPLE_RATE).toFixed(2)}s)`)

  const wavData = buildWav(Buffer.concat(pcmChunks), totalSamples)
  console.log(`WAV: ${wavData.length} bytes`)

  const text = await transcribe(wavData)
  console.log('\n─── Transcription ───')
  console.log(text)
}

// ─────────────────────────────────────────────────────────────────
// Decode audio file → resample to 16kHz mono S16
// ─────────────────────────────────────────────────────────────────

async function decodeFile(filePath) {
  console.log(`Reading ${filePath}...`)

  const buffer = fs.readFileSync(filePath)
  using inputContext = new ffmpeg.InputFormatContext(new ffmpeg.IOContext(buffer))

  return decodeAndResample(inputContext, Infinity)
}

// ─────────────────────────────────────────────────────────────────
// Live mic capture → resample to 16kHz mono S16
// ─────────────────────────────────────────────────────────────────

function getCaptureFormat() {
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

function getCaptureUrl(idx) {
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

// ─────────────────────────────────────────────────────────────────
// List available audio devices by probing indices
// ─────────────────────────────────────────────────────────────────

function listAudioDevices() {
  const captureFormat = getCaptureFormat()
  const devices = []

  // Silence FFmpeg stderr during device probing
  ffmpeg.log.level = ffmpeg.log.QUIET

  for (let i = 0; i < 10; i++) {
    try {
      const dict = new ffmpeg.Dictionary()
      dict.set('audio_only', '1')
      dict.set('probesize', '8192')
      const ctx = new ffmpeg.InputFormatContext(
        new ffmpeg.InputFormat(captureFormat),
        dict,
        getCaptureUrl(i)
      )
      const stream = ctx.getBestStream(ffmpeg.constants.mediaTypes.AUDIO)
      if (stream) {
        devices.push({
          index: i,
          sampleRate: stream.codecParameters.sampleRate,
          channels: stream.codecParameters.channelLayout.nbChannels
        })
      }
      ctx.destroy()
    } catch {
      // device not available
    }
  }

  ffmpeg.log.level = ffmpeg.log.WARNING

  if (devices.length === 0) {
    console.log('No audio devices found.')
    return
  }

  console.log('Available audio devices:\n')
  for (const dev of devices) {
    console.log(`  [${dev.index}] ${dev.sampleRate}Hz, ${dev.channels}ch`)
  }
  console.log(`\nRun with --device <index>:`)
  console.log(
    `  bare examples/live-audio-to-whisper.js --device ${devices[0].index} 15 http://localhost:9090`
  )
}

// ─────────────────────────────────────────────────────────────────
// Live mic capture → resample to 16kHz mono S16
// ─────────────────────────────────────────────────────────────────

async function captureAudio(dur) {
  const captureFormat = getCaptureFormat()
  const captureUrl = getCaptureUrl(deviceIndex)

  console.log(`Opening ${captureFormat} (${captureUrl})...`)

  using inputContext = new ffmpeg.InputFormatContext(
    new ffmpeg.InputFormat(captureFormat),
    new ffmpeg.Dictionary(),
    captureUrl
  )

  return decodeAndResample(inputContext, dur)
}

// ─────────────────────────────────────────────────────────────────
// Shared: decode + resample any audio input to 16kHz mono S16
// ─────────────────────────────────────────────────────────────────

function decodeAndResample(inputContext, maxDuration) {
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
    SAMPLE_RATE,
    ffmpeg.constants.channelLayouts.MONO,
    ffmpeg.constants.sampleFormats.S16
  )

  const chunks = []
  let totalSamples = 0
  const targetSamples = maxDuration * SAMPLE_RATE

  using packet = new ffmpeg.Packet()
  using raw = new ffmpeg.Frame()

  if (maxDuration < Infinity) {
    console.log(`Capturing ${maxDuration}s...`)
  }

  while (totalSamples < targetSamples) {
    // AVFoundation returns false on EAGAIN (no data ready yet) — retry with timeout
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
      output.sampleRate = SAMPLE_RATE

      const samples = new ffmpeg.Samples()
      samples.fill(output)

      const converted = resampler.convert(raw, output)
      if (converted > 0) {
        chunks.push(
          Buffer.from(samples.data.buffer, samples.data.byteOffset, converted * BYTES_PER_SAMPLE)
        )
        totalSamples += converted
      }
    }
  }

  // Flush resampler tail
  using flushOut = new ffmpeg.Frame()
  flushOut.channelLayout = ffmpeg.constants.channelLayouts.MONO
  flushOut.format = ffmpeg.constants.sampleFormats.S16
  flushOut.nbSamples = 4096
  flushOut.sampleRate = SAMPLE_RATE

  const flushSamples = new ffmpeg.Samples()
  flushSamples.fill(flushOut)

  let flushed
  while ((flushed = resampler.flush(flushOut)) > 0) {
    chunks.push(
      Buffer.from(
        flushSamples.data.buffer,
        flushSamples.data.byteOffset,
        flushed * BYTES_PER_SAMPLE
      )
    )
  }

  return chunks
}

// ─────────────────────────────────────────────────────────────────
// WAV builder (PCM 16-bit mono 16kHz)
// ─────────────────────────────────────────────────────────────────

function buildWav(pcmData, numSamples) {
  const dataSize = numSamples * BYTES_PER_SAMPLE
  const header = Buffer.alloc(44)

  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)

  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(NUM_CHANNELS, 22)
  header.writeUInt32LE(SAMPLE_RATE, 24)
  header.writeUInt32LE(SAMPLE_RATE * BYTES_PER_SAMPLE, 28)
  header.writeUInt16LE(BYTES_PER_SAMPLE, 32)
  header.writeUInt16LE(BITS_PER_SAMPLE, 34)

  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  return Buffer.concat([header, pcmData.subarray(0, dataSize)])
}

// ─────────────────────────────────────────────────────────────────
// Whisper transcription via HTTP
// ─────────────────────────────────────────────────────────────────

async function transcribe(wavData) {
  console.log(`Sending to ${whisperUrl}/inference ...`)

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

  const res = await fetch(`${whisperUrl}/inference`, {
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

// ─────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error(err.message)
  Bare.exit(1)
})
