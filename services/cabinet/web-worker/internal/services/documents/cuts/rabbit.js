
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const ChannelInfo = require('./channel');

class RabbitInfo extends ChannelInfo {
  constructor(axis, jointInfo, maleId) {
    super(axis, jointInfo, maleId);
  }
}

RabbitInfo.is = (axis) => {
  return axis.y.isLine() && axis.z.length() > .0001 && axis.x.isDirectional();
}

RabbitInfo.CHAR = 'D';

ChannelInfo.register(RabbitInfo);
module.exports = RabbitInfo;
