
const {Polygon3D, Vector3D} =
    require('../../../../../../../public/js/utils/canvas/three-d/lib');
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
