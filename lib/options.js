const binding = require('../binding')
const constants = require('./constants')

const { optionFlags } = constants

function getOption(handle, name, flags = optionFlags.SEARCH_CHILDREN) {
  return binding.getOption(handle, name, flags)
}

function setOption(handle, name, value, flags) {
  return binding.setOption(
    handle,
    name,
    value,
    flags ?? optionFlags.SEARCH_CHILDREN
  )
}

function setOptionDictionary(handle, dictionary, flags) {
  return binding.setOptionDictionary(
    handle,
    dictionary,
    flags ?? optionFlags.SEARCH_CHILDREN
  )
}

function setOptionDefaults(handle) {
  return binding.setOptionDefaults(handle)
}

function listOptionNames(handle, flags) {
  return binding.listOptionNames(handle, flags ?? optionFlags.SEARCH_CHILDREN)
}

function getOptions(handle, flags) {
  const options = {}

  for (const name of listOptionNames(handle, flags)) {
    try {
      options[name] = getOption(handle, name, flags)
    } catch {
      // TODO: handle binary and other non-string types
    }
  }

  return options
}

function copyOptions(targetHandle, sourceHandle) {
  binding.copyOptions(targetHandle, sourceHandle)
}

module.exports = {
  getOption,
  setOption,
  listOptionNames,
  getOptions,
  copyOptions,
  setOptionDictionary,
  setOptionDefaults
}
