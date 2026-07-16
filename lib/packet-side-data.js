const binding = require('../binding')
const SideData = require('./side-data')

module.exports = class PacketSideData extends SideData {
  _readType() {
    return binding.getSideDataType(this._handle)
  }

  _readName() {
    return binding.getSideDataName(this._handle)
  }

  _readBuffer() {
    return binding.getSideDataBuffer(this._handle)
  }
}
