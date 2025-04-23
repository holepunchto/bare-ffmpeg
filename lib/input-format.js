const binding = require('../binding')

let defaultName = null

switch (Bare.platform) {
  case 'darwin':
    defaultName = 'avfoundation'
    break
  case 'linux':
    defaultName = 'lavfi'
    break
  case 'win32':
    defaultName = 'dshow'
    break
}

module.exports = class FFmpegInputFormat {
  constructor(name = defaultName) {
    if (typeof name !== 'string' || name.length < 1) {
      throw new TypeError('Input format name should be a non empty string')
    }
    this._handle = binding.initInputFormat(name)
  }
}
