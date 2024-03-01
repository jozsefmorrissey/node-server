
const CutInfo = require('./cut');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');

class ChannelInfo extends CutInfo {
  constructor(set, jointInfo, maleModel) {
    super(set, jointInfo, maleModel);
    this.center = () => this.intersectionModel().center();

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

ChannelInfo.evaluateSets = (parrelleSets, zPolys) => {
  const lenG2 = parrelleSets.filter(s => s.length > 2).length;
  const lenE2 = parrelleSets.filter(s => s.length === 2).length;
  const lenE1 = parrelleSets.filter(s => s.length === 1).length;
  return !(lenG2 > 0) && ((lenE2 === 1 && lenE1 === 1) ||  lenE1 === 3);
}

CutInfo.register(ChannelInfo);
module.exports = ChannelInfo;
