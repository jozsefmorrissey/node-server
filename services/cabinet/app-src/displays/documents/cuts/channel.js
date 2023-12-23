
const CutInfo = require('./cut');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Line3D = require('../../../three-d/objects/line.js');

class ChannelInfo extends CutInfo {
  constructor(set, jointInfo, maleModel) {
    super(set, jointInfo, maleModel);
    this.primarySide = jointInfo.primarySide;

    this.axis = (rightOleft) => {
      const normals = this.normals();
      try {
        const axis = Polygon3D.axis(set, normals).max;
        const center = this.intersectModel().center();
        Object.values(axis).forEach(l => l.centerOn(center));
        axis.x = this.normalize(rightOleft, axis.x);
        axis.y = this.normalize(rightOleft, axis.y);
        axis.z = this.normalize(rightOleft, axis.z);
        return axis;
      } catch (e) {
        console.log(e);
      }
    }
  }
}

ChannelInfo.evaluateSets = (parrelleSets) => {
  const lenG2 = parrelleSets.filter(s => s.length > 2);
  const lenE2 = parrelleSets.filter(s => s.length === 2);
  const lenE1 = parrelleSets.filter(s => s.length === 1);
  return !(lenG2.length > 0 || lenE2.length > 2) && lenE2.length === 1
}

CutInfo.register(ChannelInfo);
module.exports = ChannelInfo;
