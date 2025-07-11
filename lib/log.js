const binding = require('../binding')
const constants = require('./constants')

module.exports = {
  ...constants.logLevels
}

Object.defineProperty(module.exports, 'level', {
  get() {
    return binding.getLogLevel()
  },

  set(level) {
    return binding.setLogLevel(level)
  }
})
