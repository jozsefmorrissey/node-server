
const CutInfo = require('./cut');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');

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
