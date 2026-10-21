const os = require('bare-os')

const platform = os.platform()

exports.isDarwin = platform === 'darwin'
exports.isIOS = platform === 'ios'
exports.isApple = exports.isDarwin || exports.isIOS
