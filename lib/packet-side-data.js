const binding = require('../binding')
const SideData = require('./side-data')

module.exports = SideData.from(
  binding.getSideDataType,
  binding.getSideDataName,
  binding.getSideDataBuffer
)
