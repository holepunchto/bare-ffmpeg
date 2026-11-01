// An `AVDeviceInfo`, as the binding hands it over.
module.exports = function toDeviceInfo([name, description, isDefault, mediaTypes]) {
  return { name, description, default: isDefault, mediaTypes }
}
