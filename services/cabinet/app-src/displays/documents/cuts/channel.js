
const CutInfo = require('./cut');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Line3D = require('../../../three-d/objects/line.js');

class ChannelInfo extends CutInfo {
  constructor(set, jointInfo, maleModel) {
    super(set, jointInfo, maleModel);
    this.primarySide = jointInfo.primarySide;

    this.axes = (rightOleft) => {
      const normals = this.normals();
      const nLines = {};
      try {
        nLines.x = Line3D.fromVector(normals.x);nLines.y = Line3D.fromVector(normals.y);nLines.z = Line3D.fromVector(normals.z);
      } catch (e) {
        console.log(e);
        this.normals();
      }
      const lines = [];
      let jointSet = Polygon3D.merge(Polygon3D.fromCSG(this.intersectModel()));
      try {
        const axes = Polygon3D.axes(jointSet, normals);
        axes.x = this.normalize(rightOleft, axes.x);
        axes.y = this.normalize(rightOleft, axes.y);
        axes.z = this.normalize(rightOleft, axes.z);
        return axes;
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
