
const {Polygon3D, Vector3D} = 
    require('../../../../../../../public/js/utils/canvas/three-d/lib.js');

const ChannelInfo = require('./channel');

class MortiseInfo extends ChannelInfo {
  constructor(axis, jointInfo, maleId) {
    super(axis, jointInfo, maleId);
  }
}

MortiseInfo.is = (axis) =>
  axis.y.isDirectional() && axis.x.length() > .0001;

MortiseInfo.CHAR = 'D';

ChannelInfo.register(MortiseInfo);
module.exports = MortiseInfo;
