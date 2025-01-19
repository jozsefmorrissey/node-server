
const CutInfo = require('./cut');
const {Polygon3D, Vertex3D} = require('../../../../../../../public/js/utils/canvas/three-d/lib.js');

class ChannelInfo extends CutInfo {
  constructor(axis, jointInfo, maleId) {
    super(axis, jointInfo, maleId);
    this.center = () => this.intersectionModel().center();
  }
}

ChannelInfo.is = (axis) => {
  return axis.y.isLine() && axis.z.length() > .0001 && axis.x.isSegment();
}

ChannelInfo.CHAR = 'D';

CutInfo.register(ChannelInfo);
module.exports = ChannelInfo;
