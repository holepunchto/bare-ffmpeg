const binding = require('../binding')

let defaultName = null

switch (Bare.platform) {
  case 'android':
    defaultName = 'android_camera'
    break
  case 'darwin':
  case 'ios':
    defaultName = 'avfoundation'
    break
  case 'linux':
    defaultName = 'v4l2'
    break
  case 'win32':
    defaultName = 'dshow'
    break
}

module.exports = class FFmpegInputFormat {
  constructor(name = defaultName, handle = null) {
    if (handle) {
      this._handle = handle
    } else {
      this._handle = binding.initInputFormat(name)
    }
  }

  get name() {
    return binding.getInputFormatName(this._handle)
  }

  get longName() {
    return binding.getInputFormatLongName(this._handle)
  }

  get flags() {
    return binding.getInputFormatFlags(this._handle)
  }
}
