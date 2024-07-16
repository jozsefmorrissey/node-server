
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const ChannelInfo = require('./channel');

class MortiseInfo extends ChannelInfo {
  constructor(axis, jointInfo, maleId) {
    super(axis, jointInfo, maleId);
  }
}

MortiseInfo.is = (axis) =>
  axis.y.isDirectional() && axis.x.length() > .0001;

ChannelInfo.register(MortiseInfo);
module.exports = MortiseInfo;
