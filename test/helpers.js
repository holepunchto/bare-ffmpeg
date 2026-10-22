const { platform } = Bare

exports.isDarwin = platform === 'darwin'
exports.isIOS = platform === 'ios'
exports.isApple = exports.isDarwin || exports.isIOS
